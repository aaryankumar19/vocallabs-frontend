import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Radio,
  Sparkles,
  MessageSquare,
  Volume2,
  StopCircle,
  Cloud,
  Database,
  Send,
  Users,
  Wifi,
  WifiOff,
} from "lucide-react";
import {
  Room,
  RoomEvent,
  Track,
  RemoteTrack,
  RemoteTrackPublication,
  RemoteParticipant,
  ConnectionState,
} from "livekit-client";
import { endGroupMeeting, getLiveKitToken, BACKEND_URL } from "@/lib/api";
import { getAuthToken, getAuthUser } from "@/lib/auth";
import { toast } from "sonner";

interface LiveAudioRoomProps {
  meetingId: string;
  roomName: string;
  groupId?: string | null;
  livekitUrl?: string;
  token?: string;
  title?: string;
  onLeave: () => void;
}

interface TranscriptEntry {
  id: string;
  speaker: string;
  timestamp: string;
  text: string;
}

interface ChatMessage {
  id: string;
  sender: string;
  timestamp: string;
  text: string;
}

interface ParticipantInfo {
  identity: string;
  name: string;
  isSpeaking: boolean;
  isMuted: boolean;
  isLocal: boolean;
}

export const LiveAudioRoom: React.FC<LiveAudioRoomProps> = ({
  meetingId,
  roomName,
  groupId,
  livekitUrl: propLivekitUrl,
  token: propToken,
  title = "Live Audio Room",
  onLeave,
}) => {
  const user = getAuthUser();
  const userName = user?.name || user?.email?.split("@")[0] || "Participant";
  const userEmail = user?.email || user?.id || `user-${Date.now().toString(36)}`;

  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Connecting to live audio room...");
  const [micReady, setMicReady] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "reconnecting" | "disconnected"
  >("connecting");

  const [participants, setParticipants] = useState<ParticipantInfo[]>([]);
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputChat, setInputChat] = useState("");
  const [activeTab, setActiveTab] = useState<"transcripts" | "chat" | "participants">("transcripts");
  const [isEnding, setIsEnding] = useState(false);

  // Audio & LiveKit State Refs
  const roomRef = useRef<Room | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const isRecordingRef = useRef(false);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const audioContainerRef = useRef<HTMLDivElement | null>(null);
  const remoteAudioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());

  const isMutedRef = useRef(isMuted);
  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  // --------------------------------------------------------------------------
  // 1. Initialize Microphone & Real-time VAD
  // --------------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    const initMic = async () => {
      try {
        setStatusMessage("Requesting microphone access...");
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        // Web Audio API Context for real-time speech visualizer
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;

        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.3;
        source.connect(analyser);
        analyserRef.current = analyser;

        setMicReady(true);
        setMicError(null);
        setStatusMessage("Microphone active. Connecting to LiveKit WebRTC...");

        // Real-time Voice Activity Detection (VAD) loop
        const data = new Uint8Array(analyser.frequencyBinCount);
        const SPEECH_THRESHOLD = 22;

        const tick = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(data);

          let sum = 0;
          for (let i = 0; i < data.length; i++) sum += data[i] ?? 0;
          const avg = sum / data.length;

          const speaking = avg > SPEECH_THRESHOLD && !isMutedRef.current;
          setIsSpeaking(speaking);

          // Chunk-based audio recording for Whisper STT
          if (speaking) {
            if (silenceTimerRef.current) {
              clearTimeout(silenceTimerRef.current);
              silenceTimerRef.current = null;
            }
            if (!isRecordingRef.current) {
              startChunk(streamRef.current!);
            }
          } else {
            if (isRecordingRef.current && !silenceTimerRef.current) {
              silenceTimerRef.current = setTimeout(() => {
                flushChunk();
              }, 2000);
            }
          }

          animFrameRef.current = requestAnimationFrame(tick);
        };

        tick();
      } catch (err: any) {
        if (cancelled) return;
        const msg =
          err.name === "NotAllowedError"
            ? "Microphone permission denied. Please allow microphone permissions in your browser and refresh."
            : `Microphone initialization error: ${err.message || err.name}`;
        setMicError(msg);
        setStatusMessage(msg);
      }
    };

    initMic();

    return () => {
      cancelled = true;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      stopMicTracks();
      if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
    };
  }, []);

  const stopMicTracks = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  // --------------------------------------------------------------------------
  // 2. Initialize LiveKit WebRTC Multi-user Room
  // --------------------------------------------------------------------------
  useEffect(() => {
    let isCancelled = false;
    let activeRoom: Room | null = null;

    const initLiveKit = async () => {
      try {
        setConnectionStatus("connecting");
        setStatusMessage("Fetching LiveKit WebRTC room credentials...");

        let targetUrl = propLivekitUrl;
        let targetToken = propToken;

        if (!targetUrl || !targetToken) {
          const tokenData = await getLiveKitToken(roomName, userEmail, userName, groupId);
          targetUrl = tokenData.livekit_url;
          targetToken = tokenData.token;
        }

        if (isCancelled) return;

        if (!targetUrl || !targetToken) {
          throw new Error("Missing LiveKit connection URL or token from server");
        }

        const room = new Room({
          adaptiveStream: true,
          dynacast: true,
          audioCaptureDefaults: {
            autoGainControl: true,
            echoCancellation: true,
            noiseSuppression: true,
          },
        });

        activeRoom = room;
        roomRef.current = room;

        const syncParticipants = () => {
          if (!roomRef.current) return;
          const current: ParticipantInfo[] = [];

          if (roomRef.current.localParticipant) {
            const lp = roomRef.current.localParticipant;
            current.push({
              identity: lp.identity,
              name: lp.name || userName,
              isSpeaking: lp.isSpeaking,
              isMuted: isMutedRef.current,
              isLocal: true,
            });
          }

          roomRef.current.remoteParticipants.forEach((rp: RemoteParticipant) => {
            current.push({
              identity: rp.identity,
              name: rp.name || rp.identity,
              isSpeaking: rp.isSpeaking,
              isMuted: !rp.isMicrophoneEnabled,
              isLocal: false,
            });
          });

          setParticipants(current);
        };

        room.on(RoomEvent.Connected, () => {
          if (isCancelled) return;
          setConnectionStatus("connected");
          setStatusMessage("Connected to LiveKit Cloud Room (WebRTC Multi-user)");
          syncParticipants();
        });

        room.on(RoomEvent.Reconnecting, () => {
          setConnectionStatus("reconnecting");
          setStatusMessage("Reconnecting to LiveKit Room...");
        });

        room.on(RoomEvent.Reconnected, () => {
          setConnectionStatus("connected");
          setStatusMessage("Reconnected to LiveKit Room");
          syncParticipants();
        });

        room.on(RoomEvent.Disconnected, () => {
          setConnectionStatus("disconnected");
          setStatusMessage("Disconnected from LiveKit Room");
        });

        room.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
          toast.info(`${participant.name || participant.identity} joined the room`);
          syncParticipants();
        });

        room.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
          toast.info(`${participant.name || participant.identity} left the room`);
          syncParticipants();
        });

        room.on(RoomEvent.ActiveSpeakersChanged, () => {
          syncParticipants();
        });

        room.on(
          RoomEvent.TrackSubscribed,
          (track: RemoteTrack, publication: RemoteTrackPublication, participant: RemoteParticipant) => {
            if (track.kind === Track.Kind.Audio) {
              const audioElement = track.attach();
              audioElement.id = `audio-${participant.identity}`;
              if (audioContainerRef.current) {
                audioContainerRef.current.appendChild(audioElement);
              }
              remoteAudioElementsRef.current.set(participant.identity, audioElement);
            }
          }
        );

        room.on(
          RoomEvent.TrackUnsubscribed,
          (track: RemoteTrack, publication: RemoteTrackPublication, participant: RemoteParticipant) => {
            if (track.kind === Track.Kind.Audio) {
              track.detach().forEach((el) => el.remove());
              remoteAudioElementsRef.current.delete(participant.identity);
            }
          }
        );

        room.on(RoomEvent.DataReceived, (payload: Uint8Array, participant?: RemoteParticipant) => {
          try {
            const decoded = new TextDecoder().decode(payload);
            const data = JSON.parse(decoded);
            if (data.type === "chat") {
              setChatMessages((prev) => [
                ...prev,
                {
                  id: data.id || `msg-${Date.now()}`,
                  sender: data.sender || participant?.name || "Participant",
                  timestamp: data.timestamp || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                  text: data.text || "",
                },
              ]);
            }
          } catch (e) {
            console.error("DataReceived parse error:", e);
          }
        });

        await room.connect(targetUrl, targetToken);

        if (isCancelled) {
          room.disconnect();
          return;
        }

        await room.localParticipant.setMicrophoneEnabled(!isMutedRef.current);
        syncParticipants();
      } catch (err: any) {
        if (isCancelled) return;
        console.error("LiveKit connection error:", err);
        setConnectionStatus("disconnected");
        setStatusMessage(`LiveKit notice: ${err.message || "Failed to join WebRTC room, using direct mic mode"}`);
      }
    };

    initLiveKit();

    return () => {
      isCancelled = true;
      if (activeRoom) {
        activeRoom.disconnect();
        roomRef.current = null;
      }
      remoteAudioElementsRef.current.forEach((el) => el.remove());
      remoteAudioElementsRef.current.clear();
    };
  }, [roomName, propLivekitUrl, propToken]);

  // --------------------------------------------------------------------------
  // 3. Audio Chunk Recording & Upload for Sequential Whisper STT
  // --------------------------------------------------------------------------
  const startChunk = (stream: MediaStream) => {
    try {
      audioChunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/mp4";

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.start(250);
      isRecordingRef.current = true;
    } catch (err: any) {
      console.error("MediaRecorder start error:", err);
    }
  };

  const flushChunk = () => {
    if (!mediaRecorderRef.current || !isRecordingRef.current) return;
    isRecordingRef.current = false;

    mediaRecorderRef.current.onstop = async () => {
      const mimeType = mediaRecorderRef.current?.mimeType || "audio/webm";
      const blob = new Blob(audioChunksRef.current, { type: mimeType });
      audioChunksRef.current = [];

      if (blob.size > 1000) {
        await uploadChunk(blob);
      }
    };

    try {
      mediaRecorderRef.current.stop();
    } catch (e) {
      console.error(e);
    }
  };

  const uploadChunk = async (blob: Blob) => {
    try {
      const authToken = getAuthToken();
      const formData = new FormData();
      formData.append("meeting_id", meetingId);
      formData.append("file", blob, `speech_${Date.now()}.webm`);

      const headers: Record<string, string> = {};
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
        headers["x-auth-token"] = authToken;
      }

      const res = await fetch(`${BACKEND_URL}/api/v1/livekit/upload-audio`, {
        method: "POST",
        headers,
        body: formData,
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        const transcriptText = data.transcript_text || data.message || "Speech processed";

        setTranscripts((prev) => [
          {
            id: data.file_id || String(Date.now()),
            speaker: userName,
            timestamp: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            }),
            text: transcriptText,
          },
          ...prev,
        ]);
      }
    } catch (err: any) {
      console.error("Upload error:", err);
    }
  };

  // --------------------------------------------------------------------------
  // 4. Controls: Mute/Unmute & Meeting End
  // --------------------------------------------------------------------------
  const handleToggleMute = async () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);

    if (roomRef.current) {
      try {
        await roomRef.current.localParticipant.setMicrophoneEnabled(!newMuted);
      } catch (err) {
        console.error("Failed to toggle LiveKit mic:", err);
      }
    }

    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = !newMuted;
      });
    }

    if (newMuted) {
      setIsSpeaking(false);
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      if (isRecordingRef.current) flushChunk();
    }
  };

  const handleEndMeeting = async () => {
    setIsEnding(true);
    try {
      if (groupId) {
        await endGroupMeeting(groupId, meetingId);
        toast.success("Meeting ended — transcription queued for AI commitment extraction!");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to end meeting on server");
    } finally {
      setIsEnding(false);
      if (roomRef.current) {
        roomRef.current.disconnect();
      }
      stopMicTracks();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      onLeave();
    }
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputChat.trim()) return;

    const text = inputChat.trim();
    const timeStr = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random()}`,
      sender: userName,
      timestamp: timeStr,
      text,
    };

    setChatMessages((prev) => [...prev, newMsg]);

    if (roomRef.current && roomRef.current.state === ConnectionState.Connected) {
      const payload = JSON.stringify({
        type: "chat",
        id: newMsg.id,
        sender: userName,
        timestamp: timeStr,
        text,
      });
      roomRef.current.localParticipant
        .publishData(new TextEncoder().encode(payload), {
          reliable: true,
        })
        .catch((err) => {
          console.error("Failed to broadcast chat message:", err);
        });
    }

    setInputChat("");
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  return (
    <div className="flex flex-col w-full rounded-3xl border border-[#B7E6DF] bg-white overflow-hidden shadow-lg min-h-[calc(100vh-140px)]">
      {/* Hidden audio container for remote LiveKit tracks */}
      <div ref={audioContainerRef} className="hidden" aria-hidden="true" />

      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5 border-b border-[#D1F2EE] bg-[#F3FFFE]/90 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0D9488] to-[#0284C7] flex items-center justify-center shadow-md shadow-[#0D9488]/20 text-white shrink-0">
            <Radio className="w-4.5 h-4.5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#0F292B] tracking-tight">{title}</h2>
            <div className="text-[11px] text-[#115E59] font-mono flex items-center gap-2">
              <span>
                Room: <strong className="text-[#0D9488]">{roomName}</strong>
              </span>
              <span className="hidden sm:inline">• ID: {meetingId.slice(0, 8)}...</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* LiveKit Connection Status Badge */}
          <span
            className={`hidden sm:flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border font-medium ${
              connectionStatus === "connected"
                ? "bg-[#D1F2EE] border-[#B7E6DF] text-[#0F766E]"
                : connectionStatus === "connecting" || connectionStatus === "reconnecting"
                  ? "bg-amber-50 border-amber-200 text-amber-700 animate-pulse"
                  : "bg-rose-50 border-rose-200 text-rose-700"
            }`}
          >
            {connectionStatus === "connected" ? (
              <Wifi className="w-3 h-3 text-[#0D9488]" />
            ) : (
              <WifiOff className="w-3 h-3" />
            )}
            {connectionStatus === "connected"
              ? "LiveKit SFU Active"
              : connectionStatus === "connecting"
                ? "Connecting..."
                : "Standalone Mic Mode"}
          </span>

          <span className="hidden md:flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-[#E6F2FF] border border-[#B7E6DF] text-[#0369A1] font-medium">
            <Database className="w-3 h-3 text-[#0284C7]" /> R2 + Whisper STT
          </span>

          <button
            onClick={handleEndMeeting}
            disabled={isEnding}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-sm shadow-rose-600/20 transition-all cursor-pointer disabled:opacity-60"
          >
            <StopCircle className="w-4 h-4" />
            <span>{isEnding ? "Ending..." : "End Meeting"}</span>
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0">
        {/* Left: Audio Visualizer & Participants */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center p-6 sm:p-8 border-b lg:border-b-0 lg:border-r border-[#D1F2EE] bg-[#F3FFFE]/30 gap-5 overflow-y-auto">
          {micError ? (
            <div className="text-center space-y-3 max-w-sm my-auto">
              <div className="w-16 h-16 rounded-full bg-[#F9EAF0] border-2 border-[#B7E6DF] flex items-center justify-center mx-auto text-[#BE185D]">
                <MicOff className="w-7 h-7" />
              </div>
              <p className="text-sm font-bold text-[#9D174D]">Microphone Unavailable</p>
              <p className="text-xs text-[#115E59] leading-relaxed">{micError}</p>
            </div>
          ) : (
            <>
              {/* Header tag */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#D1F2EE] border border-[#B7E6DF] text-[11px] font-semibold text-[#0F766E]">
                <Sparkles className="w-3.5 h-3.5 text-[#0D9488]" />
                REAL-TIME WEBRTC AUDIO · 2S STT CHUNKING
              </div>

              {/* Central Mic Visualizer */}
              <div className="relative flex items-center justify-center h-44 w-44">
                {/* Outer pulsing rings */}
                <div
                  className={`absolute inset-0 rounded-full transition-all duration-500 pointer-events-none ${
                    isSpeaking && !isMuted ? "bg-[#D1F2EE] scale-125 animate-ping opacity-75" : "bg-[#F3FFFE] opacity-40"
                  }`}
                />
                <div
                  className={`absolute inset-2 rounded-full transition-all duration-400 pointer-events-none ${
                    isSpeaking && !isMuted ? "bg-[#B7E6DF]/70 scale-110" : "bg-[#D1F2EE]/40"
                  }`}
                />

                {/* Mic button */}
                <button
                  onClick={handleToggleMute}
                  className={`relative z-10 w-28 h-28 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 cursor-pointer ${
                    isMuted
                      ? "bg-[#F9EAF0] border-2 border-[#B7E6DF] text-[#BE185D] shadow-[#F9EAF0]"
                      : isSpeaking
                        ? "bg-gradient-to-tr from-[#0D9488] to-[#0284C7] text-white shadow-[#0D9488]/40 scale-105"
                        : "bg-white border-2 border-[#B7E6DF] text-[#0D9488] shadow-[#D1F2EE]"
                  }`}
                  title={isMuted ? "Unmute microphone" : "Mute microphone"}
                >
                  {isMuted ? (
                    <MicOff className="w-10 h-10" />
                  ) : (
                    <Mic className={`w-10 h-10 ${isSpeaking ? "animate-pulse" : ""}`} />
                  )}
                </button>
              </div>

              {/* Audio level bars */}
              <div className="flex items-end gap-1 h-8 justify-center">
                {Array.from({ length: 16 }).map((_, i) => {
                  const heights = [20, 45, 30, 65, 80, 50, 90, 70, 40, 85, 55, 75, 35, 60, 45, 25];
                  const h = isSpeaking && !isMuted ? Math.max(6, heights[i] ?? 6) : 6;
                  return (
                    <div
                      key={i}
                      className={`w-1.5 rounded-full transition-all duration-200 ${
                        isSpeaking && !isMuted
                          ? "bg-gradient-to-t from-[#0D9488] to-[#0284C7]"
                          : "bg-[#D1F2EE]"
                      }`}
                      style={{
                        height: `${h}%`,
                        animationDelay: `${i * 50}ms`,
                      }}
                    />
                  );
                })}
              </div>

              {/* Status pill */}
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-2xl bg-white border border-[#B7E6DF] text-xs max-w-sm text-center shadow-2xs">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    isMuted
                      ? "bg-rose-500"
                      : isSpeaking
                        ? "bg-[#0D9488] animate-pulse"
                        : connectionStatus === "connected"
                          ? "bg-emerald-500"
                          : "bg-amber-400 animate-ping"
                  }`}
                />
                <span className="text-[#0F292B] font-medium truncate">
                  {isMuted ? "Microphone muted — click mic to unmute" : statusMessage}
                </span>
              </div>

              {/* Participants in room strip */}
              {participants.length > 0 && (
                <div className="w-full max-w-md bg-white rounded-2xl border border-[#B7E6DF] p-3 shadow-2xs">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-[#115E59] mb-2 px-1">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#0D9488]" />
                      Connected ({participants.length})
                    </span>
                    <span className="text-[10px] text-slate-400">Live Audio Stream</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {participants.map((p) => (
                      <div
                        key={p.identity}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs transition-all ${
                          p.isSpeaking && !p.isMuted
                            ? "bg-emerald-50 border-emerald-300 text-emerald-800 shadow-xs"
                            : p.isMuted
                              ? "bg-slate-50 border-slate-200 text-slate-500"
                              : "bg-[#F3FFFE] border-[#B7E6DF] text-[#0F292B]"
                        }`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${
                            p.isSpeaking && !p.isMuted
                              ? "bg-emerald-500 animate-ping"
                              : p.isMuted
                                ? "bg-rose-400"
                                : "bg-slate-300"
                          }`}
                        />
                        <span className="font-medium text-[11px]">
                          {p.name} {p.isLocal ? "(You)" : ""}
                        </span>
                        {p.isMuted ? (
                          <MicOff className="w-3 h-3 text-rose-500" />
                        ) : p.isSpeaking ? (
                          <Volume2 className="w-3 h-3 text-emerald-600 animate-pulse" />
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Controls row */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={handleToggleMute}
                  className={`flex items-center gap-2 px-5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                    isMuted
                      ? "bg-rose-600 hover:bg-rose-500 text-white shadow-sm shadow-rose-600/30"
                      : "bg-[#D1F2EE] hover:bg-[#B7E6DF] text-[#0F766E] border border-[#B7E6DF] shadow-2xs"
                  }`}
                >
                  {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  {isMuted ? "Unmute" : "Mute Mic"}
                </button>

                <div className="text-[11px] text-[#115E59]">
                  Speaking as: <strong className="text-[#0F292B]">{userName}</strong>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right: Transcripts, Chat & Participants Tabs */}
        <div className="lg:col-span-5 flex flex-col h-full min-h-[360px] bg-white border-t lg:border-t-0">
          {/* Tab Bar */}
          <div className="flex items-center gap-1.5 p-3 border-b border-[#D1F2EE] bg-[#F3FFFE] shrink-0">
            <button
              onClick={() => setActiveTab("transcripts")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "transcripts"
                  ? "bg-[#0D9488] text-white shadow-xs"
                  : "text-[#115E59] hover:text-[#0F292B]"
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Transcripts ({transcripts.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "chat"
                  ? "bg-[#0D9488] text-white shadow-xs"
                  : "text-[#115E59] hover:text-[#0F292B]"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Chat ({chatMessages.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("participants")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "participants"
                  ? "bg-[#0D9488] text-white shadow-xs"
                  : "text-[#115E59] hover:text-[#0F292B]"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>People ({participants.length})</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2.5 min-h-0">
            {activeTab === "transcripts" ? (
              transcripts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12 text-slate-400 space-y-2">
                  <Radio className="w-8 h-8 text-[#0D9488]/40" />
                  <p className="text-xs font-semibold text-[#0F292B]">No transcripts yet</p>
                  <p className="text-[11px] text-[#115E59] max-w-[220px]">
                    {micReady
                      ? "Speak into your mic — audio broadcasts live to others and automatically uploads for Whisper STT."
                      : "Waiting for microphone access..."}
                  </p>
                </div>
              ) : (
                transcripts.map((t) => (
                  <div
                    key={t.id}
                    className="p-3 rounded-2xl bg-[#F3FFFE] border border-[#B7E6DF] space-y-1 text-xs shadow-2xs"
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span className="text-[#0D9488] font-bold">{t.speaker}</span>
                      <span>{t.timestamp}</span>
                    </div>
                    <p className="text-[#0F292B] leading-relaxed">"{t.text}"</p>
                    <div className="text-[10px] text-[#0284C7] flex items-center gap-1 font-medium">
                      <Cloud className="w-3 h-3" /> Saved to R2 &amp; DB
                    </div>
                  </div>
                ))
              )
            ) : activeTab === "chat" ? (
              chatMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12 text-slate-400 space-y-2">
                  <MessageSquare className="w-8 h-8 text-[#0D9488]/40" />
                  <p className="text-xs font-semibold text-[#0F292B]">No messages yet</p>
                  <p className="text-[11px] text-[#115E59]">
                    Type a message below — synced via LiveKit Data Channel
                  </p>
                </div>
              ) : (
                <>
                  {chatMessages.map((m) => (
                    <div
                      key={m.id}
                      className="p-3 rounded-2xl bg-[#F3FFFE] border border-[#B7E6DF] space-y-1 text-xs shadow-2xs"
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span className="font-bold text-[#0F292B]">{m.sender}</span>
                        <span>{m.timestamp}</span>
                      </div>
                      <p className="text-[#115E59]">{m.text}</p>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </>
              )
            ) : (
              /* Participants Tab */
              <div className="space-y-2">
                <div className="text-[11px] text-[#115E59] font-medium mb-3">
                  All active participants in this LiveKit room:
                </div>
                {participants.map((p) => (
                  <div
                    key={p.identity}
                    className="flex items-center justify-between p-3 rounded-2xl bg-[#F3FFFE] border border-[#B7E6DF] text-xs shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] ${
                          p.isLocal ? "bg-[#0D9488] text-white" : "bg-[#D1F2EE] text-[#0F766E]"
                        }`}
                      >
                        {p.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-[#0F292B] flex items-center gap-1.5">
                          <span>{p.name}</span>
                          {p.isLocal && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#D1F2EE] text-[#0F766E] font-medium">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">{p.identity}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {p.isSpeaking && !p.isMuted ? (
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <Volume2 className="w-3 h-3 animate-pulse" /> Speaking
                        </span>
                      ) : p.isMuted ? (
                        <span className="flex items-center gap-1 text-[10px] font-medium text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          <MicOff className="w-3 h-3" /> Muted
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Listening</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chat Input */}
          {activeTab === "chat" && (
            <form
              onSubmit={handleSendChat}
              className="p-3 border-t border-[#D1F2EE] bg-[#F3FFFE] flex items-center gap-2 shrink-0"
            >
              <input
                type="text"
                value={inputChat}
                onChange={(e) => setInputChat(e.target.value)}
                placeholder="Send a real-time message to room..."
                className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-[#B7E6DF] text-xs text-[#0F292B] placeholder-slate-400 focus:outline-none focus:border-[#0D9488] focus:ring-2 focus:ring-[#D1F2EE] shadow-2xs"
              />
              <button
                type="submit"
                disabled={!inputChat.trim()}
                className="p-2 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white disabled:opacity-40 transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
