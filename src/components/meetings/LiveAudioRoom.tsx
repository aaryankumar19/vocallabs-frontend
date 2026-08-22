import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Radio,
  Sparkles,
  MessageSquare,
  Volume2,
  UploadCloud,
  StopCircle,
  CheckCircle2,
  Cloud,
  Database,
  Send,
} from "lucide-react";
import { endGroupMeeting, BACKEND_URL } from "@/lib/api";
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

export const LiveAudioRoom: React.FC<LiveAudioRoomProps> = ({
  meetingId,
  roomName,
  groupId,
  title = "Live Audio Session",
  onLeave,
}) => {
  const user = getAuthUser();
  const userName = user?.name || user?.email?.split("@")[0] || "Participant";

  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Initializing microphone...");
  const [micReady, setMicReady] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);

  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputChat, setInputChat] = useState("");
  const [activeTab, setActiveTab] = useState<"transcripts" | "chat">("transcripts");
  const [isEnding, setIsEnding] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  // Audio state refs
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const isRecordingRef = useRef(false);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const isMutedRef = useRef(isMuted);
  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  // Initialize microphone
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

        // AudioContext for real-time VAD
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
        setStatusMessage("Listening for speech...");

        // VAD loop
        const data = new Uint8Array(analyser.frequencyBinCount);
        const SPEECH_THRESHOLD = 20;

        const tick = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(data);

          let sum = 0;
          for (let i = 0; i < data.length; i++) sum += (data[i] ?? 0);
          const avg = sum / data.length;

          const speaking = avg > SPEECH_THRESHOLD && !isMutedRef.current;
          setIsSpeaking(speaking);

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
        const msg = err.name === "NotAllowedError"
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
      setStatusMessage("🎙️ Recording speech segment...");
    } catch (err: any) {
      console.error("MediaRecorder start error:", err);
    }
  };

  const flushChunk = () => {
    if (!mediaRecorderRef.current || !isRecordingRef.current) return;
    isRecordingRef.current = false;
    setStatusMessage("⏳ Processing speech chunk...");

    mediaRecorderRef.current.onstop = async () => {
      const mimeType = mediaRecorderRef.current?.mimeType || "audio/webm";
      const blob = new Blob(audioChunksRef.current, { type: mimeType });
      audioChunksRef.current = [];

      if (blob.size > 1000) {
        await uploadChunk(blob);
      } else {
        setStatusMessage("Listening for speech...");
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
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
            text: transcriptText,
          },
          ...prev,
        ]);
        setStatusMessage("✅ Speech uploaded & queued for transcription");
      } else {
        const err = await res.json().catch(() => ({}));
        setStatusMessage(`⚠️ Upload failed: ${err.detail || res.status}`);
      }
    } catch (err: any) {
      setStatusMessage(`⚠️ Upload error: ${err.message}`);
    } finally {
      setTimeout(() => setStatusMessage("Listening for speech..."), 2000);
    }
  };

  const handleToggleMute = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = isMuted; // toggle
      });
    }
    setIsMuted((prev) => !prev);
    if (!isMuted) {
      setIsSpeaking(false);
      if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
      if (isRecordingRef.current) flushChunk();
    }
  };

  const handleEndMeeting = async () => {
    setIsEnding(true);
    try {
      if (groupId) {
        await endGroupMeeting(groupId, meetingId);
        toast.success("Meeting ended — transcription queued for analysis!");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to end meeting on server");
    } finally {
      setIsEnding(false);
      stopMicTracks();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      onLeave();
    }
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputChat.trim()) return;
    setChatMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        sender: userName,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        text: inputChat.trim(),
      },
    ]);
    setInputChat("");
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  return (
    <div className="flex flex-col w-full rounded-3xl border border-[#B7E6DF] bg-white overflow-hidden shadow-lg min-h-[calc(100vh-160px)]">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5 border-b border-[#D1F2EE] bg-[#F3FFFE]/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0D9488] to-[#0284C7] flex items-center justify-center shadow-md shadow-[#0D9488]/20 text-white">
            <Radio className="w-4.5 h-4.5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#0F292B] tracking-tight">{title}</h2>
            <div className="text-[11px] text-[#115E59] font-mono flex items-center gap-2">
              <span>Room: <strong className="text-[#0D9488]">{roomName}</strong></span>
              <span className="hidden sm:inline">• ID: {meetingId.slice(0, 8)}...</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden md:flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-[#D1F2EE] border border-[#B7E6DF] text-[#0F766E] font-medium">
            <Cloud className="w-3 h-3 text-[#0D9488]" /> LiveKit Cloud
          </span>
          <span className="hidden md:flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-[#E6F2FF] border border-[#B7E6DF] text-[#0369A1] font-medium">
            <Database className="w-3 h-3 text-[#0284C7]" /> R2 Storage
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
        {/* Left: Audio Visualizer */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center gap-6 p-8 border-b lg:border-b-0 lg:border-r border-[#D1F2EE] bg-[#F3FFFE]/40">

          {micError ? (
            <div className="text-center space-y-3 max-w-sm">
              <div className="w-20 h-20 rounded-full bg-[#F9EAF0] border-2 border-[#B7E6DF] flex items-center justify-center mx-auto text-[#BE185D]">
                <MicOff className="w-8 h-8" />
              </div>
              <p className="text-sm font-bold text-[#9D174D]">Microphone Unavailable</p>
              <p className="text-xs text-[#115E59] leading-relaxed">{micError}</p>
            </div>
          ) : (
            <>
              <div className="text-center space-y-1">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#D1F2EE] border border-[#B7E6DF] text-[11px] font-semibold text-[#0F766E]">
                  <Sparkles className="w-3.5 h-3.5 text-[#0D9488]" />
                  AUDIO-ONLY · NO VIDEO · 2S SILENCE CHUNKING
                </div>
              </div>

              {/* Central Mic Visualizer */}
              <div className="relative flex items-center justify-center">
                {/* Outer rings */}
                <div className={`absolute w-52 h-52 rounded-full transition-all duration-500 ${isSpeaking ? "bg-[#D1F2EE] scale-110 animate-ping" : "bg-[#F3FFFE]"}`} />
                <div className={`absolute w-40 h-40 rounded-full transition-all duration-400 ${isSpeaking ? "bg-[#B7E6DF]/70 scale-105" : "bg-[#D1F2EE]/50"}`} />

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
                  const h = isSpeaking && !isMuted ? Math.max(4, heights[i] ?? 4) : 4;
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
                <span className={`w-2 h-2 rounded-full shrink-0 ${
                  isMuted ? "bg-rose-500" : isSpeaking ? "bg-[#0D9488] animate-pulse" : "bg-slate-400"
                }`} />
                <span className="text-[#0F292B] font-medium truncate">
                  {isMuted ? "Microphone muted — click mic to unmute" : statusMessage}
                </span>
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
                  You: <strong className="text-[#0F292B]">{userName}</strong>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right: Transcripts & Chat */}
        <div className="lg:col-span-5 flex flex-col h-full min-h-[300px] bg-white">
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
          </div>

          {/* Tab Content */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2.5">
            {activeTab === "transcripts" ? (
              transcripts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12 text-slate-400 space-y-2">
                  <Radio className="w-8 h-8 text-[#0D9488]/40" />
                  <p className="text-xs font-semibold text-[#0F292B]">No transcripts yet</p>
                  <p className="text-[11px] text-[#115E59] max-w-[200px]">
                    {micReady
                      ? "Speak into your mic — speech will auto-record, upload, and transcribe."
                      : "Waiting for microphone access..."}
                  </p>
                </div>
              ) : (
                transcripts.map((t) => (
                  <div key={t.id} className="p-3 rounded-2xl bg-[#F3FFFE] border border-[#B7E6DF] space-y-1 text-xs shadow-2xs">
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
            ) : chatMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12 text-slate-400 space-y-2">
                <MessageSquare className="w-8 h-8 text-[#0D9488]/40" />
                <p className="text-xs font-semibold text-[#0F292B]">No messages yet</p>
                <p className="text-[11px] text-[#115E59]">Type a message below</p>
              </div>
            ) : (
              <>
                {chatMessages.map((m) => (
                  <div key={m.id} className="p-3 rounded-2xl bg-[#F3FFFE] border border-[#B7E6DF] space-y-1 text-xs shadow-2xs">
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span className="font-bold text-[#0F292B]">{m.sender}</span>
                      <span>{m.timestamp}</span>
                    </div>
                    <p className="text-[#115E59]">{m.text}</p>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </>
            )}
          </div>

          {/* Chat Input */}
          {activeTab === "chat" && (
            <form onSubmit={handleSendChat} className="p-3 border-t border-[#D1F2EE] bg-[#F3FFFE] flex items-center gap-2">
              <input
                type="text"
                value={inputChat}
                onChange={(e) => setInputChat(e.target.value)}
                placeholder="Send a note..."
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
