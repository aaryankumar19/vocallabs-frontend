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
  title = "Live Audio Session",
  onLeave,
}) => {
  const user = getAuthUser();
  const userName = user?.name || user?.email?.split("@")[0] || "Participant";

  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Initializing audio room...");
  const [micReady, setMicReady] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);

  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "reconnecting" | "disconnected"
  >("connecting");
  const [participants, setParticipants] = useState<ParticipantInfo[]>([]);

  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputChat, setInputChat] = useState("");
  const [activeTab, setActiveTab] = useState<"transcripts" | "chat" | "participants">(
    "transcripts",
  );
  const [isEnding, setIsEnding] = useState(false);

  // Audio & LiveKit state refs
  const roomRef = useRef<Room | null>(null);
  const remoteAudioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const audioContainerRef = useRef<HTMLDivElement | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const isRecordingRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxChunkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recordingStartTimeRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const isMutedRef = useRef(isMuted);
  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  // --------------------------------------------------------------------------
  // 1. Initialize Microphone (Local VAD & Audio Chunking for STT)
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

        // AudioContext for real-time VAD visualization and chunk slicing
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
        setStatusMessage("Mic connected. Joining LiveKit room...");

        // VAD loop
        const data = new Uint8Array(analyser.frequencyBinCount);
        const SPEECH_THRESHOLD = 18;

        const tick = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(data);

          let sum = 0;
          for (let i = 0; i < data.length; i++) sum += data[i] ?? 0;
          const avg = sum / data.length;

          const speaking = avg > SPEECH_THRESHOLD && !isMutedRef.current;
          setIsSpeaking(speaking);
          isSpeakingRef.current = speaking;

          if (speaking) {
            if (silenceTimerRef.current) {
              clearTimeout(silenceTimerRef.current);
              silenceTimerRef.current = null;
            }
            if (!isRecordingRef.current && streamRef.current) {
              startChunk(streamRef.current);
            }
          } else {
            if (isRecordingRef.current && !silenceTimerRef.current) {
              // 1-second silence delay: upload fragment when speech pauses for 1s
              silenceTimerRef.current = setTimeout(() => {
                flushChunk();
              }, 1000);
            }
          }

          animFrameRef.current = requestAnimationFrame(tick);
        };

        tick();
      } catch (err: any) {
        if (cancelled) return;
        const msg =
          err.name === "NotAllowedError"
            ? "Microphone permission denied. Please allow microphone access in your browser and reload."
            : `Microphone error: ${err.message || err.name}`;
        setMicError(msg);
        setStatusMessage(msg);
      }
    };

    initMic();

    return () => {
      cancelled = true;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (maxChunkTimerRef.current) clearTimeout(maxChunkTimerRef.current);
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
  // 2. Connect to LiveKit Cloud Room (WebRTC Multi-Participant Broadcasting)
  // --------------------------------------------------------------------------
  useEffect(() => {
    let isCancelled = false;
    let activeRoom: Room | null = null;

    const initLiveKit = async () => {
      try {
        let lkToken = propToken;
        let lkUrl = propLivekitUrl;

        // If token or URL not passed in props, fetch token dynamically from backend
        if (!lkToken || !lkUrl) {
          setStatusMessage("Fetching room credentials...");
          const identity = user?.email || user?.id || `user-${Date.now().toString(36)}`;
          const tokenRes = await getLiveKitToken(
            roomName,
            identity,
            userName,
            groupId || undefined,
          );
          lkToken = tokenRes.token;
          lkUrl = tokenRes.livekit_url;
        }

        if (isCancelled) return;

        setConnectionStatus("connecting");
        setStatusMessage("Connecting to LiveKit audio room...");

        const room = new Room({
          adaptiveStream: true,
          dynacast: true,
          audioCaptureDefaults: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        activeRoom = room;
        roomRef.current = room;

        const syncParticipants = () => {
          if (!room) return;
          const list: ParticipantInfo[] = [];

          // Local participant
          list.push({
            identity: room.localParticipant.identity,
            name: room.localParticipant.name || userName,
            isSpeaking: room.localParticipant.isSpeaking,
            isMuted: !room.localParticipant.isMicrophoneEnabled,
            isLocal: true,
          });

          // Remote participants
          room.remoteParticipants.forEach((p) => {
            const micPub = p.getTrackPublication(Track.Source.Microphone);
            const isParticipantMuted = !micPub || micPub.isMuted;
            list.push({
              identity: p.identity,
              name: p.name || p.identity,
              isSpeaking: p.isSpeaking,
              isMuted: isParticipantMuted,
              isLocal: false,
            });
          });

          setParticipants(list);
        };

        // Room event listeners
        room
          .on(RoomEvent.Connected, () => {
            if (isCancelled) return;
            setConnectionStatus("connected");
            setStatusMessage("Live audio broadcasting connected");
            syncParticipants();
          })
          .on(RoomEvent.Reconnecting, () => {
            setConnectionStatus("reconnecting");
            setStatusMessage("Reconnecting audio stream...");
          })
          .on(RoomEvent.Reconnected, () => {
            setConnectionStatus("connected");
            setStatusMessage("Audio stream reconnected");
            syncParticipants();
          })
          .on(RoomEvent.Disconnected, () => {
            setConnectionStatus("disconnected");
            setStatusMessage("Disconnected from room");
          })
          .on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
            toast.info(`${participant.name || participant.identity} joined`);
            syncParticipants();
          })
          .on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
            toast.info(`${participant.name || participant.identity} left`);
            syncParticipants();
          })
          .on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
            syncParticipants();
            // Speaker change detection: if local user was recording and another speaker takes over, flush chunk
            const isLocalActive = speakers.some((s) => s.isLocal);
            if (!isLocalActive && isRecordingRef.current) {
              console.log("[LiveAudio] Active speaker changed from local -> flushing audio chunk");
              flushChunk();
            }
          })
          .on(RoomEvent.TrackMuted, () => {
            syncParticipants();
          })
          .on(RoomEvent.TrackUnmuted, () => {
            syncParticipants();
          })
          .on(
            RoomEvent.TrackSubscribed,
            (
              track: RemoteTrack,
              publication: RemoteTrackPublication,
              participant: RemoteParticipant,
            ) => {
              if (track.kind === Track.Kind.Audio) {
                // Attach remote audio track to an HTMLAudioElement for playback through speakers
                const audioElement = track.attach();
                audioElement.id = `lk-audio-${participant.identity}-${track.sid}`;
                audioElement.autoplay = true;

                if (audioContainerRef.current) {
                  audioContainerRef.current.appendChild(audioElement);
                } else {
                  document.body.appendChild(audioElement);
                }

                remoteAudioElementsRef.current.set(track.sid, audioElement);
                audioElement.play().catch((err) => {
                  console.warn("Audio autoplay blocked or failed:", err);
                });
              }
              syncParticipants();
            },
          )
          .on(
            RoomEvent.TrackUnsubscribed,
            (
              track: RemoteTrack,
              publication: RemoteTrackPublication,
              participant: RemoteParticipant,
            ) => {
              if (track.kind === Track.Kind.Audio) {
                track.detach().forEach((el) => el.remove());
                const existing = remoteAudioElementsRef.current.get(track.sid);
                if (existing) {
                  existing.remove();
                  remoteAudioElementsRef.current.delete(track.sid);
                }
              }
              syncParticipants();
            },
          )
          .on(RoomEvent.DataReceived, (payload: Uint8Array, participant?: RemoteParticipant) => {
            try {
              const str = new TextDecoder().decode(payload);
              const data = JSON.parse(str);
              if (data.type === "chat") {
                setChatMessages((prev) => [
                  ...prev,
                  {
                    id: data.id || `msg-${Date.now()}-${Math.random()}`,
                    sender:
                      data.sender || participant?.name || participant?.identity || "Participant",
                    timestamp:
                      data.timestamp ||
                      new Date().toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      }),
                    text: data.text,
                  },
                ]);
                setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
              }
            } catch (e) {
              console.error("Failed to parse data message", e);
            }
          });

        await room.connect(lkUrl, lkToken);

        // Publish local microphone to LiveKit SFU so all other participants receive the audio
        await room.localParticipant.setMicrophoneEnabled(!isMutedRef.current);
        syncParticipants();
      } catch (err: any) {
        if (isCancelled) return;
        console.error("LiveKit connection error:", err);
        setConnectionStatus("disconnected");
        setStatusMessage(`LiveKit error: ${err.message || "Failed to join room"}`);
        toast.error(`LiveKit audio error: ${err.message || "Could not connect to room"}`);
      }
    };

    initLiveKit();

    return () => {
      isCancelled = true;
      if (activeRoom) {
        activeRoom.disconnect();
        roomRef.current = null;
      }
      // Clean up remote audio elements
      remoteAudioElementsRef.current.forEach((el) => el.remove());
      remoteAudioElementsRef.current.clear();
    };
  }, [roomName, propLivekitUrl, propToken]);

  // --------------------------------------------------------------------------
  // 3. Audio Chunk Recording & Upload for Sequential Whisper STT
  // --------------------------------------------------------------------------
  const startChunk = (stream: MediaStream) => {
    if (isMutedRef.current || isRecordingRef.current) return;
    try {
      audioChunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/mp4";

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      recordingStartTimeRef.current = Date.now();

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.start(100);
      isRecordingRef.current = true;

      // Max continuous chunk duration: 1.5s interval to ensure fragments are sent progressively
      if (maxChunkTimerRef.current) clearTimeout(maxChunkTimerRef.current);
      maxChunkTimerRef.current = setTimeout(() => {
        if (isRecordingRef.current) {
          flushChunk().then(() => {
            if (isSpeakingRef.current && !isMutedRef.current && streamRef.current) {
              startChunk(streamRef.current);
            }
          });
        }
      }, 1500);
    } catch (err: any) {
      console.error("[LiveAudio] MediaRecorder start error:", err);
    }
  };

  const flushChunk = async (): Promise<void> => {
    if (!mediaRecorderRef.current || !isRecordingRef.current) return;
    isRecordingRef.current = false;

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (maxChunkTimerRef.current) {
      clearTimeout(maxChunkTimerRef.current);
      maxChunkTimerRef.current = null;
    }

    const recorder = mediaRecorderRef.current;
    mediaRecorderRef.current = null;

    return new Promise((resolve) => {
      recorder.onstop = async () => {
        const mimeType = recorder.mimeType || "audio/webm";
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        audioChunksRef.current = [];

        if (blob.size > 800) {
          await uploadChunk(blob);
        }
        resolve();
      };

      try {
        if (recorder.state !== "inactive") {
          recorder.stop();
        } else {
          resolve();
        }
      } catch (e) {
        console.error("[LiveAudio] Error stopping recorder:", e);
        resolve();
      }
    });
  };

  const uploadChunk = async (blob: Blob) => {
    const chunkTimestamp = Date.now();
    try {
      const authToken = getAuthToken();
      const formData = new FormData();
      formData.append("meeting_id", meetingId);
      formData.append("file", blob, `speech_${chunkTimestamp}.webm`);

      const headers: Record<string, string> = {};
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
        headers["x-auth-token"] = authToken;
      }

      console.log(`[LiveAudio] Uploading audio fragment: size=${blob.size}B, meeting=${meetingId}`);

      const res = await fetch(`${BACKEND_URL}/api/v1/livekit/upload-audio`, {
        method: "POST",
        headers,
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => "");
        throw new Error(`Upload failed (${res.status}): ${errorText || res.statusText}`);
      }

      const data = await res.json().catch(() => ({}));
      console.log("[LiveAudio] Audio fragment uploaded successfully:", data);

      const transcriptText = data.transcript_text || data.message || "Audio chunk queued for STT";

      setTranscripts((prev) => [
        {
          id: data.file_id || String(chunkTimestamp),
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
    } catch (err: any) {
      console.error("[LiveAudio] Chunk upload error:", err);
      toast.error(`Audio upload error: ${err.message || "Failed to upload audio chunk"}`);
    }
  };

  // --------------------------------------------------------------------------
  // 4. Controls: Mute/Unmute & Meeting End
  // --------------------------------------------------------------------------
  const handleToggleMute = async () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);

    // Mute/unmute in LiveKit SFU (stops/starts sending audio packets to other participants)
    if (roomRef.current) {
      try {
        await roomRef.current.localParticipant.setMicrophoneEnabled(!newMuted);
      } catch (err) {
        console.error("Failed to toggle LiveKit mic:", err);
      }
    }

    // Toggle local stream tracks for VAD/recorder
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = !newMuted;
      });
    }

    if (newMuted) {
      setIsSpeaking(false);
      isSpeakingRef.current = false;
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      if (maxChunkTimerRef.current) {
        clearTimeout(maxChunkTimerRef.current);
        maxChunkTimerRef.current = null;
      }
      if (isRecordingRef.current) {
        await flushChunk();
      }
    }
  };

  const handleEndMeeting = async () => {
    setIsEnding(true);
    try {
      // 1. Flush any pending audio fragment and await upload before ending
      if (isRecordingRef.current) {
        await flushChunk();
      }

      // 2. Call backend meeting end endpoint
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

    // Add to local state
    setChatMessages((prev) => [...prev, newMsg]);

    // Broadcast across all connected room participants via LiveKit Data Channel
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
    <div className="flex flex-col w-full rounded-3xl border border-[#B7E6DF] bg-white overflow-hidden shadow-lg min-h-[calc(100vh-160px)]">
      {/* Hidden audio container for remote LiveKit tracks */}
      <div ref={audioContainerRef} className="hidden" aria-hidden="true" />

      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5 border-b border-[#D1F2EE] bg-[#F3FFFE]/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0D9488] to-[#0284C7] flex items-center justify-center shadow-md shadow-[#0D9488]/20 text-white">
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
                ? "Connecting LiveKit..."
                : "Disconnected"}
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
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left: Audio Visualizer & Participants */}
        <div className="lg:col-span-7 flex flex-col items-center justify-between p-6 sm:p-8 border-b lg:border-b-0 lg:border-r border-[#D1F2EE] bg-[#F3FFFE]/40 space-y-6">
          {micError ? (
            <div className="text-center space-y-3 max-w-sm my-auto">
              <div className="w-20 h-20 rounded-full bg-[#F9EAF0] border-2 border-[#B7E6DF] flex items-center justify-center mx-auto text-[#BE185D]">
                <MicOff className="w-8 h-8" />
              </div>
              <p className="text-sm font-bold text-[#9D174D]">Microphone Unavailable</p>
              <p className="text-xs text-[#115E59] leading-relaxed">{micError}</p>
            </div>
          ) : (
            <>
              {/* Header tags */}
              <div className="text-center space-y-1">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#D1F2EE] border border-[#B7E6DF] text-[11px] font-semibold text-[#0F766E]">
                  <Sparkles className="w-3.5 h-3.5 text-[#0D9488]" />
                  REAL-TIME WEBRTC AUDIO · 2S STT CHUNKING
                </div>
              </div>

              {/* Central Mic Visualizer */}
              <div className="relative flex items-center justify-center my-4">
                {/* Outer pulsing rings */}
                <div
                  className={`absolute w-52 h-52 rounded-full transition-all duration-500 ${
                    isSpeaking && !isMuted ? "bg-[#D1F2EE] scale-110 animate-ping" : "bg-[#F3FFFE]"
                  }`}
                />
                <div
                  className={`absolute w-40 h-40 rounded-full transition-all duration-400 ${
                    isSpeaking && !isMuted ? "bg-[#B7E6DF]/70 scale-105" : "bg-[#D1F2EE]/50"
                  }`}
                />

                {/* Mic button */}
                <button
                  onClick={handleToggleMute}
                  className={`relative w-28 h-28 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 cursor-pointer ${
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
              <div className="flex items-end gap-1 h-10 justify-center">
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
              <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-[#B7E6DF] text-xs max-w-sm text-center shadow-2xs">
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
              <div className="w-full max-w-md bg-white rounded-2xl border border-[#B7E6DF] p-3 shadow-2xs">
                <div className="flex items-center justify-between text-[11px] font-semibold text-[#115E59] mb-2 px-1">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#0D9488]" />
                    In Room ({participants.length})
                  </span>
                  <span className="text-[10px] text-slate-400">Live Audio Stream</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {participants.map((p) => (
                    <div
                      key={p.identity}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs transition-all ${
                        p.isSpeaking && !p.isMuted
                          ? "bg-emerald-50 border-emerald-300 text-emerald-800 shadow-xs ring-2 ring-emerald-400/40"
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

              {/* Controls row */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleToggleMute}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
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
        <div className="lg:col-span-5 flex flex-col h-full min-h-[360px] bg-white">
          {/* Tab Bar */}
          <div className="flex items-center gap-1.5 p-3 border-b border-[#D1F2EE] bg-[#F3FFFE]">
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
          <div className="flex-1 p-3 overflow-y-auto space-y-2.5">
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
              className="p-3 border-t border-[#D1F2EE] bg-[#F3FFFE] flex items-center gap-2"
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
