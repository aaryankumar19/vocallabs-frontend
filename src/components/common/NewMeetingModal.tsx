import React, { useState, useRef } from "react";
import {
  X,
  Upload,
  Sparkles,
  Radio,
  FileAudio,
  Loader2,
  AlertCircle,
  Building2,
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
  const [mode, setMode] = useState<"upload" | "live">("live");
  const [meetingTitle, setMeetingTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("");
  const [submitError, setSubmitError] = useState("");

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
    setSubmitError("");

    if (!selectedFile) {
      setSubmitError("Please select an audio file to transcribe.");
      return;
    }

    try {
      setIsProcessing(true);
      setProcessingStatus("Uploading audio to Whisper STT backend...");

      await transcribeAudioFile(selectedFile, meetingTitle || selectedFile.name);

      setProcessingStatus("Analyzing and extracting commitments...");
      toast.success("Meeting audio transcribed and analyzed successfully!");
      onMeetingProcessed();
      onClose();
      resetForm();
    } catch (err: any) {
      const msg = err.message || "Failed to process audio meeting";
      setSubmitError(msg);
      toast.error(msg);
    } finally {
      setIsProcessing(false);
      setProcessingStatus("");
    }
  };

  const handleStartLiveMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    if (!selectedGroup) {
      setSubmitError("You must select or create a group before starting a live meeting. Use the workspace switcher in the top bar.");
      return;
    }

    try {
      setIsProcessing(true);
      setProcessingStatus("Initializing LiveKit WebRTC room & database record...");

      const title = meetingTitle.trim() || `Live ${selectedGroup.name} Session`;
      const res: StartMeetingResponse = await startGroupMeeting(selectedGroup.id, title);

      if (!res.token || !res.livekit_url || !res.meeting_id || !res.room_name) {
        throw new Error(
          `Backend returned incomplete room data. Got: meeting_id=${res.meeting_id}, token=${res.token ? "✓" : "✗"}, livekit_url=${res.livekit_url || "missing"}`
        );
      }

      toast.success(`Live audio room "${res.title}" started!`);
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
      const msg = err.message || "Failed to start live meeting";
      setSubmitError(msg);
      toast.error(msg);
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
    setSubmitError("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F292B]/40 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-[#B7E6DF] bg-[#F3FFFE]/98 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl">
        {/* Close */}
        <button
          onClick={() => { resetForm(); onClose(); }}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-[#0F292B] rounded-xl hover:bg-[#D1F2EE] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#D1F2EE] border border-[#B7E6DF] flex items-center justify-center text-[#0D9488]">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#0F292B]">Process New Meeting</h3>
            {selectedGroup ? (
              <div className="flex items-center gap-1.5 text-xs text-[#0F766E] font-medium">
                <Building2 className="w-3.5 h-3.5 text-[#0D9488]" />
                <span className="font-semibold">{selectedGroup.name}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-[#9D174D] font-medium">
                <AlertCircle className="w-3.5 h-3.5 text-[#BE185D]" />
                <span>No workspace selected — use the top bar group switcher</span>
              </div>
            )}
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <button
            type="button"
            onClick={() => { setMode("upload"); setSubmitError(""); }}
            className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition-all cursor-pointer ${
              mode === "upload"
                ? "border-[#0D9488] bg-[#D1F2EE] text-[#0F292B] shadow-xs font-semibold"
                : "border-[#B7E6DF] bg-white text-slate-600 hover:border-[#0D9488] hover:text-[#0F292B]"
            }`}
          >
            <Upload className={`w-6 h-6 mb-1.5 ${mode === "upload" ? "text-[#0D9488]" : "text-slate-400"}`} />
            <span className="text-xs font-bold">Upload Audio Recording</span>
            <span className="text-[11px] text-slate-500 mt-0.5">MP3, WAV, M4A, WEBM</span>
          </button>

          <button
            type="button"
            onClick={() => { setMode("live"); setSubmitError(""); }}
            className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition-all cursor-pointer ${
              mode === "live"
                ? "border-[#0D9488] bg-[#D1F2EE] text-[#0F292B] shadow-xs font-semibold"
                : "border-[#B7E6DF] bg-white text-slate-600 hover:border-[#0D9488] hover:text-[#0F292B]"
            }`}
          >
            <Radio className={`w-6 h-6 mb-1.5 text-rose-500 ${mode === "live" ? "animate-pulse" : ""}`} />
            <span className="text-xs font-bold">Start Live Audio Room</span>
            <span className="text-[11px] text-slate-500 mt-0.5">LiveKit Voice &amp; Chat</span>
          </button>
        </div>

        {/* Error banner */}
        {submitError && (
          <div className="mb-4 p-3.5 rounded-2xl bg-[#F9EAF0] border border-[#B7E6DF] text-[#9D174D] text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#BE185D]" />
            <span>{submitError}</span>
          </div>
        )}

        {/* No group warning for live mode */}
        {mode === "live" && !selectedGroup && (
          <div className="mb-4 p-3.5 rounded-2xl bg-[#F9EAF0] border border-[#B7E6DF] text-[#9D174D] text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#BE185D]" />
            <span>
              A workspace (group) is required to start a live meeting. Use the group switcher in the top navigation bar to create or select a group first.
            </span>
          </div>
        )}

        {/* Upload Form */}
        {mode === "upload" ? (
          <form onSubmit={handleTranscribeAudio} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#115E59] mb-1.5">
                Meeting Title <span className="text-slate-400 font-normal normal-case">(optional)</span>
              </label>
              <input
                type="text"
                value={meetingTitle}
                onChange={(e) => setMeetingTitle(e.target.value)}
                placeholder="e.g. Architecture Discussion, Sprint Planning"
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#B7E6DF] text-sm text-[#0F292B] placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#0D9488] focus:ring-2 focus:ring-[#D1F2EE]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#115E59] mb-1.5">
                Audio File <span className="text-rose-500">*</span>
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
                className="border-2 border-dashed border-[#B7E6DF] hover:border-[#0D9488] rounded-2xl p-6 text-center cursor-pointer bg-white/60 hover:bg-[#D1F2EE]/30 transition-all flex flex-col items-center"
              >
                <FileAudio className="w-8 h-8 text-[#0D9488] mb-2" />
                {selectedFile ? (
                  <div>
                    <span className="block text-xs font-bold text-[#0F292B]">{selectedFile.name}</span>
                    <span className="block text-[11px] text-[#115E59] mt-0.5">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Click to change
                    </span>
                  </div>
                ) : (
                  <div>
                    <span className="block text-xs font-semibold text-[#0F292B]">Click to select audio file</span>
                    <span className="block text-[11px] text-slate-500 mt-0.5">
                      Whisper STT will transcribe and extract commitments automatically
                    </span>
                  </div>
                )}
              </div>
            </div>

            {isProcessing && (
              <div className="p-3.5 rounded-2xl bg-[#D1F2EE] border border-[#B7E6DF] flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-[#0D9488] animate-spin shrink-0" />
                <span className="text-xs text-[#0F766E]">{processingStatus}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#D1F2EE]">
              <button
                type="button"
                onClick={() => { resetForm(); onClose(); }}
                className="px-4 py-2 rounded-xl text-xs font-medium text-[#115E59] hover:text-[#0F292B] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isProcessing || !selectedFile}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[#0D9488] via-[#0891B2] to-[#0284C7] hover:from-[#0F766E] hover:to-[#0369A1] shadow-sm shadow-[#0D9488]/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Transcribe &amp; Extract
              </button>
            </div>
          </form>
        ) : (
          /* Live Meeting Form */
          <form onSubmit={handleStartLiveMeeting} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#115E59] mb-1.5">
                Session Title <span className="text-slate-400 font-normal normal-case">(optional)</span>
              </label>
              <input
                type="text"
                value={meetingTitle}
                onChange={(e) => setMeetingTitle(e.target.value)}
                placeholder={selectedGroup ? `Live ${selectedGroup.name} Session` : "e.g. Weekly Standup, Client Sync"}
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#B7E6DF] text-sm text-[#0F292B] placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#0D9488] focus:ring-2 focus:ring-[#D1F2EE]"
              />
            </div>

            <div className="p-4 rounded-2xl bg-[#D1F2EE]/60 border border-[#B7E6DF] text-xs space-y-2.5">
              <div className="flex items-center gap-2 text-[#0D9488] font-bold">
                <Radio className="w-4 h-4 text-[#0D9488] animate-pulse" />
                <span>How it works</span>
              </div>
              <ul className="text-[#115E59] text-[11px] leading-relaxed space-y-1 list-none pl-0">
                <li>🎙️ Microphone captures your voice in real-time</li>
                <li>⏱️ After 2 seconds of silence, the speech chunk is auto-uploaded</li>
                <li>☁️ Audio stored in Cloudflare R2, transcribed via Whisper STT</li>
                <li>🤖 Commitments extracted by LangGraph AI agent</li>
              </ul>
            </div>

            {isProcessing && (
              <div className="p-3.5 rounded-2xl bg-[#D1F2EE] border border-[#B7E6DF] flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-[#0D9488] animate-spin shrink-0" />
                <span className="text-xs text-[#0F766E]">{processingStatus}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#D1F2EE]">
              <button
                type="button"
                onClick={() => { resetForm(); onClose(); }}
                className="px-4 py-2 rounded-xl text-xs font-medium text-[#115E59] hover:text-[#0F292B] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isProcessing || !selectedGroup}
                title={!selectedGroup ? "Select a group first from the top bar" : ""}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#0D9488] hover:bg-[#0F766E] shadow-sm shadow-[#0D9488]/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Radio className="w-4 h-4" />
                )}
                {isProcessing ? "Starting..." : "Enter Live Audio Room"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
