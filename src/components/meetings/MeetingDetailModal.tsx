import React, { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  Video,
  CheckCircle2,
  Clock,
  FileText,
  CheckSquare,
  Layers,
  Loader2,
  Calendar,
} from "lucide-react";
import {
  MeetingItem,
  ApiCommitment,
  TranscriptItem,
  getMeetingTranscripts,
  getMeetingCommitments,
  analyzeMeetingCommitments,
} from "@/lib/api";
import { toast } from "sonner";

interface MeetingDetailModalProps {
  meeting: MeetingItem | null;
  onClose: () => void;
  onSelectCommitment: (comm: ApiCommitment) => void;
}

export const MeetingDetailModal: React.FC<MeetingDetailModalProps> = ({
  meeting,
  onClose,
  onSelectCommitment,
}) => {
  const [activeTab, setActiveTab] = useState<"transcript" | "commitments">("transcript");
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  const [commitments, setCommitments] = useState<ApiCommitment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (!meeting) return;
    const loadMeetingData = async () => {
      try {
        setIsLoading(true);
        const [trList, commList] = await Promise.all([
          getMeetingTranscripts(meeting.id).catch(() => []),
          getMeetingCommitments(meeting.id).catch(() => []),
        ]);
        setTranscripts(trList);
        setCommitments(commList);
      } catch (err) {
        console.error("Failed to load meeting details:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadMeetingData();
  }, [meeting?.id]);

  if (!meeting) return null;

  const handleAnalyze = async () => {
    try {
      setIsAnalyzing(true);
      await analyzeMeetingCommitments(meeting.id);
      toast.success("AI Commitment Agent analyzed the meeting successfully!");
      const updatedComm = await getMeetingCommitments(meeting.id);
      setCommitments(updatedComm);
      setActiveTab("commitments");
    } catch (err: any) {
      toast.error(err.message || "Failed to analyze commitments");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl border border-white/10 bg-[#070C1E]/95 backdrop-blur-2xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-6 sm:p-8 border-b border-white/5 bg-slate-950/40">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-blue-500/15 text-cyan-300 border border-blue-500/30">
                  {meeting.source.toUpperCase()}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {new Date(meeting.created_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-300">
                  {meeting.status}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">{meeting.title}</h2>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs & Actions */}
          <div className="flex items-center justify-between gap-2 mt-6 pt-4 border-t border-white/5">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab("transcript")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "transcript"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Transcript ({transcripts.length})</span>
              </button>

              <button
                onClick={() => setActiveTab("commitments")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "commitments"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Commitments ({commitments.length})</span>
              </button>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-md shadow-blue-600/20 disabled:opacity-50 cursor-pointer"
            >
              {isAnalyzing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              Run AI Analysis
            </button>
          </div>
        </div>

        {/* Modal Body / Tab Content */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
              <span className="text-xs">Loading data...</span>
            </div>
          ) : (
            <>
              {activeTab === "transcript" && (
                <div className="space-y-3">
                  {transcripts.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-xs">
                      No transcript entries found for this meeting.
                    </div>
                  ) : (
                    transcripts.map((t, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 space-y-1 text-xs"
                      >
                        <div className="flex items-center justify-between text-slate-400 font-mono text-[11px]">
                          <span className="font-bold text-cyan-400">
                            {t.speaker || `Speaker ${idx + 1}`}
                          </span>
                          {t.timestamp && <span>{t.timestamp}</span>}
                        </div>
                        <p className="text-slate-200 leading-relaxed">{t.text}</p>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === "commitments" && (
                <div className="space-y-3">
                  {commitments.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-xs space-y-3">
                      <div>No commitments extracted yet.</div>
                      <button
                        onClick={handleAnalyze}
                        disabled={isAnalyzing}
                        className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 cursor-pointer"
                      >
                        Extract Commitments with AI
                      </button>
                    </div>
                  ) : (
                    commitments.map((comm) => (
                      <div
                        key={comm.id}
                        onClick={() => {
                          onSelectCommitment(comm);
                          onClose();
                        }}
                        className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 hover:border-blue-500/30 transition-all flex items-center justify-between gap-4 cursor-pointer"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{comm.title}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-300">
                              {comm.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-400">
                            {comm.owner && (
                              <span>
                                Owner: <strong className="text-slate-200">{comm.owner}</strong>
                              </span>
                            )}
                            <span>
                              Created: {new Date(comm.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        {comm.verification_confidence !== null && comm.verification_confidence !== undefined && (
                          <div className="flex items-center gap-2 font-mono text-cyan-400 text-xs font-bold">
                            <span>{Math.round(comm.verification_confidence * 100)}% Confidence</span>
                            <span>→</span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
