import React, { useState, useRef } from "react";
import {
  X,
  Mic,
  Upload,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Video,
  FileAudio,
  Radio,
} from "lucide-react";
import { startGroupMeeting, transcribeAudioFile, Group, StartMeetingResponse } from "@/lib/api";
import { toast } from "sonner";

interface NewMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedGroup: Group | null;
  onMeetingProcessed: () => void;
  onEnterLiveRoom?: (room: {
    meetingId: string;
    roomName: string;
    token: string;
    livekitUrl: string;
    title: string;
  }) => void;
}

export const NewMeetingModal: React.FC<NewMeetingModalProps> = ({
  isOpen,
  onClose,
  selectedGroup,
  onMeetingProcessed,
  onEnterLiveRoom,
}) => {
  const [mode, setMode] = useState<"upload" | "live">("upload");
  const [meetingTitle, setMeetingTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!meetingTitle) {
        setMeetingTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleTranscribeAudio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error("Please select an audio file to transcribe.");
      return;
    }

    try {
      setIsProcessing(true);
      setProcessingStatus("Uploading audio to backend & running Whisper STT...");

      await transcribeAudioFile(
        selectedFile,
        meetingTitle || selectedFile.name,
        selectedGroup?.id,
      );

      setProcessingStatus("Extracting commitments with AI agent...");
      toast.success("Meeting audio transcribed and analyzed successfully!");
      onMeetingProcessed();
      onClose();
      resetForm();
    } catch (err: any) {
      toast.error(err.message || "Failed to process audio meeting");
    } finally {
      setIsProcessing(false);
      setProcessingStatus("");
    }
  };

  const handleStartLiveMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup) {
      toast.error("Please select or create a group first.");
      return;
    }

    try {
      setIsProcessing(true);
      setProcessingStatus("Initializing LiveKit WebRTC room & database record...");

      const title = meetingTitle || `Live ${selectedGroup.name} Audio Session`;
      const res: StartMeetingResponse = await startGroupMeeting(selectedGroup.id, title);

      toast.success("Live audio room started!");
      onMeetingProcessed();
      onClose();
      resetForm();

      if (onEnterLiveRoom) {
        onEnterLiveRoom({
          meetingId: res.meeting_id,
          roomName: res.room_name,
          token: res.token,
          livekitUrl: res.livekit_url,
          title: res.title,
        });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to start live meeting");
    } finally {
      setIsProcessing(false);
      setProcessingStatus("");
    }
  };

  const resetForm = () => {
    setMeetingTitle("");
    setSelectedFile(null);
    setIsProcessing(false);
    setProcessingStatus("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-white/10 bg-slate-900/95 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl">
        {/* Ambient glow */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={() => {
            resetForm();
            onClose();
          }}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Process New Meeting</h3>
              <p className="text-xs text-slate-400">
                {selectedGroup ? `Workspace: ${selectedGroup.name}` : "Select a group to start"}
              </p>
            </div>
          </div>

          {/* Mode selection: Audio Upload vs Start Live Audio Room */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <button
              type="button"
              onClick={() => setMode("upload")}
              className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                mode === "upload"
                  ? "border-blue-500 bg-blue-500/15 text-white shadow-lg shadow-blue-500/10"
                  : "border-white/5 bg-slate-950/40 text-slate-400 hover:border-white/10 hover:text-slate-200"
              }`}
            >
              <Upload className="w-6 h-6 mb-1.5 text-cyan-400" />
              <span className="text-xs font-bold">Upload Audio Recording</span>
              <span className="text-[11px] text-slate-400 mt-0.5">MP3, WAV, M4A, WEBM</span>
            </button>

            <button
              type="button"
              onClick={() => setMode("live")}
              className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                mode === "live"
                  ? "border-blue-500 bg-blue-500/15 text-white shadow-lg shadow-blue-500/10"
                  : "border-white/5 bg-slate-950/40 text-slate-400 hover:border-white/10 hover:text-slate-200"
              }`}
            >
              <Radio className="w-6 h-6 mb-1.5 text-rose-400 animate-pulse" />
              <span className="text-xs font-bold">Start Live Audio Room</span>
              <span className="text-[11px] text-slate-400 mt-0.5">LiveKit Voice &amp; Chat</span>
            </button>
          </div>

          {mode === "upload" ? (
            <form onSubmit={handleTranscribeAudio} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Meeting Title
                </label>
                <input
                  type="text"
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  placeholder="e.g. Architecture Discussion, Sprint Planning"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Audio File
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="audio/*,.mp3,.wav,.m4a,.webm,.ogg"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-white/15 hover:border-cyan-500/50 rounded-2xl p-6 text-center cursor-pointer bg-slate-950/40 hover:bg-slate-950/60 transition-all flex flex-col items-center justify-center"
                >
                  <FileAudio className="w-8 h-8 text-cyan-400 mb-2" />
                  {selectedFile ? (
                    <div>
                      <span className="block text-xs font-bold text-white">{selectedFile.name}</span>
                      <span className="block text-[11px] text-slate-400 mt-0.5">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to transcribe
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span className="block text-xs font-semibold text-slate-200">
                        Click to select audio file
                      </span>
                      <span className="block text-[11px] text-slate-400 mt-0.5">
                        FastAPI Whisper STT will transcribe and extract commitments
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {isProcessing && (
                <div className="p-3.5 rounded-2xl bg-blue-950/40 border border-blue-500/30 flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                  <span className="text-xs text-slate-200">{processingStatus}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    onClose();
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing || !selectedFile}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-lg shadow-blue-500/25 disabled:opacity-50 cursor-pointer"
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Transcribe &amp; Extract
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleStartLiveMeeting} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Live Meeting Title
                </label>
                <input
                  type="text"
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  placeholder="e.g. Weekly Standup, Client Sync"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-500/20 text-xs space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 font-bold">
                  <Radio className="w-4 h-4 animate-pulse" />
                  <span>Real-Time LiveKit Audio Room</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Audio-only session with live speech detection. When speaking ends (2s silence), speech segments are uploaded to Cloudflare R2 and transcribed directly into your workspace.
                </p>
              </div>

              {isProcessing && (
                <div className="p-3.5 rounded-2xl bg-blue-950/40 border border-blue-500/30 flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                  <span className="text-xs text-slate-200">{processingStatus}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    onClose();
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing || !selectedGroup}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/25 disabled:opacity-50 cursor-pointer"
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Radio className="w-4 h-4" />}
                  Enter Live Audio Room
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
