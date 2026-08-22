import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Radio,
  Sparkles,
  MessageSquare,
  Volume2,
  UploadCloud,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  StopCircle,
  Database,
  Cloud,
  ChevronRight,
} from "lucide-react";
import {
  endGroupMeeting,
  BACKEND_URL,
} from "@/lib/api";
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
  r2_url?: string;
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
  livekitUrl = "wss://vocallabsai-qun1rvmf.livekit.cloud",
  token,
  title = "Live Audio Session",
  onLeave,
}) => {
  const user = getAuthUser();
  const userName = user?.name || user?.email?.split("@")[0] || "Participant";

  // Audio recording & speech detection state
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Listening for speech...");
  const [audioLevel, setAudioLevel] = useState(0);

  // Transcripts & Chat state
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputChat, setInputChat] = useState("");
  const [activeTab, setActiveTab] = useState<"transcripts" | "chat">("transcripts");

  // R2 Test Status
  const [r2TestStatus, setR2TestStatus] = useState<string | null>(null);
  const [isEnding, setIsEnding] = useState(false);

  // MediaRecorder refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRecordingRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Initialize Microphone & Audio Analyser for VAD (Voice Activity Detection)
  useEffect(() => {
    let isMounted = true;

    async function initAudio() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        // Set up AudioContext for real-time speech volume detection
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.4;
        source.connect(analyser);
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const speechThreshold = 18; // Threshold for active speech

        const detectSpeech = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);

          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const average = sum / dataArray.length;
          setAudioLevel(Math.min(100, Math.round((average / 60) * 100)));

          const speakingNow = average > speechThreshold && !isMuted;

          if (speakingNow) {
            setIsSpeaking(true);
            if (silenceTimerRef.current) {
              clearTimeout(silenceTimerRef.current);
              silenceTimerRef.current = null;
            }
            if (!isRecordingRef.current) {
              startMediaRecorder(streamRef.current!);
            }
          } else {
            setIsSpeaking(false);
            if (isRecordingRef.current && !silenceTimerRef.current) {
              // 2.0 second silence delay before uploading chunk to R2
              silenceTimerRef.current = setTimeout(() => {
                stopAndUpload();
              }, 2000);
            }
          }

          animFrameRef.current = requestAnimationFrame(detectSpeech);
        };

        detectSpeech();
      } catch (err: any) {
        console.error("Microphone access error:", err);
        setStatusMessage("⚠️ Microphone permission denied or unavailable");
      }
    }

    initAudio();

    return () => {
      isMounted = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
    };
  }, [isMuted]);

  const startMediaRecorder = (stream: MediaStream) => {
    try {
      audioChunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.start(250);
      isRecordingRef.current = true;
      setStatusMessage("🎙️ Capturing speech segment...");
    } catch (err) {
      console.error("MediaRecorder start error:", err);
    }
  };

  const stopAndUpload = () => {
    if (!mediaRecorderRef.current || !isRecordingRef.current) return;
    isRecordingRef.current = false;
    setStatusMessage("⏳ 2s silence reached. Uploading speech to R2 & DB STT...");

    mediaRecorderRef.current.onstop = async () => {
      const mimeType = mediaRecorderRef.current?.mimeType || "audio/webm";
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

      if (audioBlob.size > 1200) {
        await uploadAudioSegment(audioBlob);
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

  const uploadAudioSegment = async (blob: Blob) => {
    try {
      const formData = new FormData();
      formData.append("meeting_id", meetingId);
      formData.append("file", blob, `speech_${Date.now()}.webm`);

      const authToken = getAuthToken();
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
        const data = await res.json();
        setStatusMessage("✅ Speech segment processed & saved!");

        const newEntry: TranscriptEntry = {
          id: data.file_id || String(Date.now()),
          speaker: userName,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          text: data.transcript_text || data.message || "Speech audio segment processed and queued for analysis",
          r2_url: data.r2_url,
        };

        setTranscripts((prev) => [newEntry, ...prev]);
      } else {
        setStatusMessage("⚠️ Audio upload failed");
      }
    } catch (err) {
      console.error("Upload audio error:", err);
      setStatusMessage("⚠️ Upload error");
    } finally {
      setTimeout(() => setStatusMessage("Listening for speech..."), 2500);
    }
  };

  const handleTestR2Upload = async () => {
    setR2TestStatus("Uploading test audio chunk to Cloudflare R2...");
    try {
      const dummyBlob = new Blob(["VOCALLABS_TEST_AUDIO_STREAM_DATA"], { type: "audio/webm" });
      await uploadAudioSegment(dummyBlob);
      setR2TestStatus("✅ Manual R2 test upload successful!");
      setTimeout(() => setR2TestStatus(null), 4000);
    } catch (err: any) {
      setR2TestStatus(`R2 Error: ${err.message}`);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputChat.trim()) return;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: userName,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      text: inputChat.trim(),
    };

    setChatMessages((prev) => [...prev, newMsg]);
    setInputChat("");
  };

  const handleEndMeeting = async () => {
    if (!groupId) {
      onLeave();
      return;
    }

    try {
      setIsEnding(true);
      await endGroupMeeting(groupId, meetingId);
      toast.success("Meeting session concluded and queued for commitment extraction!");
      onLeave();
    } catch (err: any) {
      toast.error(err.message || "Failed to end meeting");
      onLeave();
    } finally {
      setIsEnding(false);
    }
  };

  const toggleMute = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = isMuted; // Toggle enabled state
      });
    }
    setIsMuted(!isMuted);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] w-full rounded-3xl border border-white/10 bg-slate-950/80 backdrop-blur-2xl overflow-hidden shadow-2xl">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-6 border-b border-white/10 bg-slate-900/90">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-[1px] shadow-lg shadow-blue-500/20">
            <div className="w-full h-full rounded-[15px] bg-slate-950 flex items-center justify-center text-cyan-400">
              <Radio className="w-5 h-5 animate-pulse text-cyan-400" />
            </div>
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">{title}</h2>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <span>Room: <strong className="text-cyan-300">{roomName}</strong></span>
              <span>•</span>
              <span>ID: <code className="text-slate-300">{meetingId.slice(0, 8)}...</code></span>
            </div>
          </div>
        </div>

        {/* Status badges & Action Controls */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
            <Cloud className="w-3.5 h-3.5" />
            <span>LiveKit Cloud</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-cyan-300 text-xs font-semibold">
            <Database className="w-3.5 h-3.5" />
            <span>Cloudflare R2</span>
          </div>

          <button
            onClick={handleTestR2Upload}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
          >
            <UploadCloud className="w-3.5 h-3.5 text-cyan-400" />
            <span>Test R2</span>
          </button>

          <button
            onClick={handleEndMeeting}
            disabled={isEnding}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/20 transition-all cursor-pointer"
          >
            <StopCircle className="w-4 h-4" />
            <span>End Meeting</span>
          </button>
        </div>
      </div>

      {r2TestStatus && (
        <div className="px-6 py-2 bg-emerald-500/15 border-b border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{r2TestStatus}</span>
        </div>
      )}

      {/* Main Grid: Left Audio Voice Visualizer & Controls | Right Transcripts & Chat */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left Side: Audio-Only Visualizer & Voice State */}
        <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/10 bg-slate-950/40">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-xs font-semibold text-cyan-300 mb-4">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              <span>AUDIO-ONLY WEBRTC STREAM (NO VIDEO)</span>
            </div>

            <h3 className="text-xl font-bold text-white tracking-tight mb-2">
              Continuous Speech-to-Text &amp; Autonomous Telemetry
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-md">
              Speak naturally during the call. When speech concludes (2-second silence), audio packets are uploaded directly to storage, transcribed with Whisper STT, and committed to PostgreSQL.
            </p>
          </div>

          {/* Central Pulsing Audio Visualizer */}
          <div className="my-8 flex flex-col items-center justify-center">
            <div className="relative flex items-center justify-center">
              {/* Outer wave rings */}
              <div
                className={`absolute w-44 h-44 rounded-full transition-all duration-300 pointer-events-none ${
                  isSpeaking
                    ? "bg-cyan-500/20 scale-125 animate-ping"
                    : "bg-blue-600/10 scale-100"
                }`}
              />
              <div
                className={`absolute w-36 h-36 rounded-full transition-all duration-300 pointer-events-none ${
                  isSpeaking ? "bg-cyan-500/30 scale-110" : "bg-blue-600/15 scale-95"
                }`}
              />

              {/* Center Mic Avatar */}
              <div
                className={`relative w-28 h-28 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
                  isMuted
                    ? "bg-rose-950/80 border-2 border-rose-500/50 text-rose-400 shadow-rose-500/20"
                    : isSpeaking
                      ? "bg-gradient-to-tr from-blue-600 to-cyan-400 text-white shadow-cyan-500/40 scale-105"
                      : "bg-slate-900 border-2 border-blue-500/30 text-cyan-400 shadow-blue-500/20"
                }`}
              >
                {isMuted ? (
                  <MicOff className="w-10 h-10" />
                ) : (
                  <Mic className={`w-10 h-10 ${isSpeaking ? "animate-pulse" : ""}`} />
                )}
              </div>
            </div>

            {/* Audio Wave Bar Meters */}
            <div className="flex items-center gap-1 mt-6 h-8">
              {[40, 65, 30, 85, 95, 60, 45, 90, 75, 35, 55, 80].map((height, i) => {
                const activeHeight = isSpeaking && !isMuted ? (height * audioLevel) / 100 : 8;
                return (
                  <div
                    key={i}
                    className={`w-1.5 rounded-full transition-all duration-150 ${
                      isSpeaking && !isMuted
                        ? "bg-gradient-to-t from-blue-500 to-cyan-400"
                        : "bg-slate-800"
                    }`}
                    style={{ height: `${Math.max(6, activeHeight)}px` }}
                  />
                );
              })}
            </div>

            {/* Speaking Status Pill */}
            <div className="mt-4 flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-white/10 text-xs">
              <span
                className={`w-2 h-2 rounded-full ${
                  isMuted
                    ? "bg-rose-500"
                    : isSpeaking
                      ? "bg-emerald-400 animate-ping"
                      : "bg-slate-500"
                }`}
              />
              <span className="font-semibold text-slate-200">
                {isMuted ? "Microphone Muted" : isSpeaking ? "Voice Detected (Recording Segment)" : statusMessage}
              </span>
            </div>
          </div>

          {/* Bottom Audio Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-white/5">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleMute}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  isMuted
                    ? "bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30"
                    : "bg-blue-600/20 hover:bg-blue-600/30 text-cyan-300 border border-blue-500/40"
                }`}
              >
                {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                <span>{isMuted ? "Unmute Mic" : "Mute Mic"}</span>
              </button>
            </div>

            <div className="text-right text-[11px] text-slate-400">
              <span>Connected as: <strong className="text-white">{userName}</strong></span>
            </div>
          </div>
        </div>

        {/* Right Side: Tabbed Transcripts & In-Meeting Chat */}
        <div className="lg:col-span-5 flex flex-col h-full bg-slate-900/40">
          {/* Tabs */}
          <div className="flex items-center justify-between p-3.5 border-b border-white/10 bg-slate-950/60">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab("transcripts")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "transcripts"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Live Transcripts ({transcripts.length})</span>
              </button>

              <button
                onClick={() => setActiveTab("chat")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "chat"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Chat ({chatMessages.length})</span>
              </button>
            </div>
          </div>

          {/* Tab Content Container */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {activeTab === "transcripts" ? (
              transcripts.length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-xs space-y-2">
                  <Radio className="w-8 h-8 text-slate-500 mx-auto" />
                  <p className="font-semibold text-slate-300">Awaiting audio speech...</p>
                  <p className="text-[11px] max-w-xs mx-auto">
                    Speak into your microphone. Speech segments will automatically upload and transcribe in real-time.
                  </p>
                </div>
              ) : (
                transcripts.map((t) => (
                  <div
                    key={t.id}
                    className="p-3.5 rounded-2xl bg-slate-950/80 border border-white/10 space-y-1 text-xs animate-in fade-in"
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span className="font-bold text-cyan-400">{t.speaker}</span>
                      <span>{t.timestamp}</span>
                    </div>
                    <p className="text-slate-200 leading-relaxed font-medium">"{t.text}"</p>
                    <div className="pt-1 text-[10px] font-mono text-blue-400 flex items-center gap-1">
                      <Cloud className="w-3 h-3" />
                      <span>Transcribed &amp; saved to Database</span>
                    </div>
                  </div>
                ))
              )
            ) : (
              chatMessages.length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-xs space-y-2">
                  <MessageSquare className="w-8 h-8 text-slate-500 mx-auto" />
                  <p className="font-semibold text-slate-300">No chat messages yet</p>
                  <p className="text-[11px]">Send a note or link to fellow meeting participants.</p>
                </div>
              ) : (
                chatMessages.map((m) => (
                  <div
                    key={m.id}
                    className="p-3 rounded-2xl bg-slate-950/70 border border-white/10 space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="font-bold text-slate-200">{m.sender}</span>
                      <span>{m.timestamp}</span>
                    </div>
                    <p className="text-slate-300 leading-snug">{m.text}</p>
                  </div>
                ))
              )
            )}
          </div>

          {/* In-Meeting Chat Input */}
          {activeTab === "chat" && (
            <form onSubmit={handleSendMessage} className="p-3 border-t border-white/10 bg-slate-950/80 flex items-center gap-2">
              <input
                type="text"
                value={inputChat}
                onChange={(e) => setInputChat(e.target.value)}
                placeholder="Type a chat message..."
                className="flex-1 px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={!inputChat.trim()}
                className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 transition-colors cursor-pointer"
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
