import React, { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  CheckCircle2,
  Clock,
  CheckSquare,
  Loader2,
  Calendar,
  AlertTriangle,
  User,
  ShieldCheck,
  ChevronRight,
  RefreshCw,
  Zap,
} from "lucide-react";
import {
  MeetingItem,
  ApiCommitment,
  getMeetingCommitments,
  analyzeMeetingCommitments,
  verifyCommitment,
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
  const [commitments, setCommitments] = useState<ApiCommitment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const loadCommitments = async () => {
    if (!meeting) return;
    try {
      setIsLoading(true);
      const commList = await getMeetingCommitments(meeting.id).catch(() => []);
      setCommitments(commList || []);
    } catch (err) {
      console.error("Failed to load meeting commitments:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCommitments();
  }, [meeting?.id]);

  if (!meeting) return null;

  const handleAnalyze = async () => {
    try {
      setIsAnalyzing(true);
      await analyzeMeetingCommitments(meeting.id);
      toast.success("AI Commitment Agent successfully extracted commitments from meeting audio!");
      await loadCommitments();
    } catch (err: any) {
      toast.error(err.message || "Failed to analyze commitments");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleVerifyCommitment = async (e: React.MouseEvent, commId: string) => {
    e.stopPropagation();
    try {
      setVerifyingId(commId);
      await verifyCommitment(commId);
      toast.success("Autonomous verification agent evaluated commitment successfully!");
      await loadCommitments();
    } catch (err: any) {
      toast.error(err.message || "Verification failed");
    } finally {
      setVerifyingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s.includes("complete") || s === "done") {
      return "bg-[#D1F2EE] text-[#0F766E] border-[#B7E6DF]";
    }
    if (s.includes("progress") || s === "ongoing") {
      return "bg-[#E6F2FF] text-[#0369A1] border-[#B7E6DF]";
    }
    if (s.includes("risk") || s === "blocked") {
      return "bg-[#F9EAF0] text-[#9D174D] border-[#B7E6DF]";
    }
    return "bg-[#F3FFFE] text-[#115E59] border-[#B7E6DF]";
  };

  const totalCount = commitments.length;
  const completedCount = commitments.filter((c) => (c.status || "").toLowerCase().includes("complete")).length;
  const inProgressCount = commitments.filter((c) => (c.status || "").toLowerCase().includes("progress")).length;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4 sm:p-6 bg-[#0F292B]/40 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl border border-[#B7E6DF] bg-[#F3FFFE]/98 backdrop-blur-2xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-6 sm:p-8 border-b border-[#D1F2EE] bg-[#D1F2EE]/30">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#D1F2EE] text-[#0D9488] border border-[#B7E6DF]">
                  {meeting.source.toUpperCase()}
                </span>
                <span className="text-xs text-[#115E59] font-mono flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[#0D9488]" />
                  {new Date(meeting.created_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#E6F2FF] text-[#0369A1] border border-[#B7E6DF]/60">
                  {meeting.status}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#0F292B] tracking-tight">{meeting.title}</h2>
              <p className="text-xs text-[#115E59] mt-1">
                Meeting Commitments &amp; AI LangGraph Autonomous Verification
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-[#0F292B] rounded-xl hover:bg-[#D1F2EE] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Metrics Bar & Action Trigger */}
          <div className="flex flex-wrap items-center justify-between gap-3 mt-6 pt-4 border-t border-[#B7E6DF]/60">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#B7E6DF] text-xs font-semibold text-[#0F292B] shadow-2xs">
                <CheckSquare className="w-3.5 h-3.5 text-[#0D9488]" />
                <span>Total: {totalCount}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#D1F2EE] border border-[#B7E6DF] text-xs font-semibold text-[#0F766E]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#0D9488]" />
                <span>Completed: {completedCount}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#E6F2FF] border border-[#B7E6DF] text-xs font-semibold text-[#0369A1]">
                <Clock className="w-3.5 h-3.5 text-[#0284C7]" />
                <span>In Progress: {inProgressCount}</span>
              </div>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[#0D9488] via-[#0891B2] to-[#0284C7] hover:from-[#0F766E] hover:to-[#0369A1] shadow-sm shadow-[#0D9488]/20 disabled:opacity-50 cursor-pointer transition-all active:scale-[0.98]"
            >
              {isAnalyzing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-white" />
              )}
              <span>{isAnalyzing ? "Extracting Commitments..." : "Extract Commitments with AI"}</span>
            </button>
          </div>
        </div>

        {/* Modal Body: Commitments List */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#0D9488]" />
              <span className="text-xs font-medium text-[#115E59]">Loading commitments from backend...</span>
            </div>
          ) : commitments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center rounded-3xl border border-dashed border-[#B7E6DF] bg-white/70 p-8 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#D1F2EE] border border-[#B7E6DF] flex items-center justify-center text-[#0D9488]">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="max-w-md">
                <h4 className="text-base font-bold text-[#0F292B]">No commitments extracted yet</h4>
                <p className="text-xs text-[#115E59] mt-1 leading-relaxed">
                  Run the LangGraph AI Commitment Extraction Agent on this meeting to identify action items, assignees, deadlines, and verification confidence.
                </p>
              </div>
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#0D9488] hover:bg-[#0F766E] shadow-sm shadow-[#0D9488]/20 cursor-pointer disabled:opacity-50"
              >
                {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                Run AI Commitment Agent
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {commitments.map((comm) => {
                const isVerifying = verifyingId === comm.id;
                const ownerName = comm.owner || comm.assignee || "Assigned by AI";
                const ownerInitial = ownerName.charAt(0).toUpperCase() || "A";
                const extractionConf = comm.extraction_confidence ?? comm.confidence;
                const verificationConf = comm.verification_confidence;

                return (
                  <div
                    key={comm.id}
                    onClick={() => {
                      onSelectCommitment(comm);
                      onClose();
                    }}
                    className="group relative overflow-hidden rounded-2xl bg-white border border-[#B7E6DF] hover:border-[#0D9488] p-5 transition-all duration-200 hover:shadow-md cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs"
                  >
                    {/* Left: Title, Description, Owner */}
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadge(
                            comm.status,
                          )}`}
                        >
                          {comm.status}
                        </span>
                        <h4 className="text-sm font-bold text-[#0F292B] group-hover:text-[#0D9488] transition-colors">
                          {comm.title}
                        </h4>
                      </div>

                      {comm.description && (
                        <p className="text-xs text-[#115E59] leading-relaxed line-clamp-2">
                          {comm.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-1">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-[#D1F2EE] border border-[#B7E6DF] flex items-center justify-center font-bold text-[#0D9488] text-[10px]">
                            {ownerInitial}
                          </div>
                          <span>
                            Owner: <strong className="text-[#0F292B]">{ownerName}</strong>
                          </span>
                        </div>

                        {comm.deadline && (
                          <div className="flex items-center gap-1 text-slate-500">
                            <Calendar className="w-3 h-3 text-[#0D9488]" />
                            <span>Due: {new Date(comm.deadline).toLocaleDateString()}</span>
                          </div>
                        )}

                        {extractionConf !== null && extractionConf !== undefined && (
                          <div className="flex items-center gap-1 text-[#0D9488] font-mono font-medium">
                            <Sparkles className="w-3 h-3" />
                            <span>
                              {Math.round(extractionConf > 1 ? extractionConf : extractionConf * 100)}% Extracted
                            </span>
                          </div>
                        )}

                        {verificationConf !== null && verificationConf !== undefined && (
                          <div className="flex items-center gap-1 text-[#0F766E] font-mono font-semibold">
                            <ShieldCheck className="w-3.5 h-3.5 text-[#0D9488]" />
                            <span>
                              {Math.round(verificationConf > 1 ? verificationConf : verificationConf * 100)}% Verified
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#D1F2EE]">
                      <button
                        type="button"
                        onClick={(e) => handleVerifyCommitment(e, comm.id)}
                        disabled={isVerifying}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#D1F2EE] hover:bg-[#B7E6DF] border border-[#B7E6DF] text-xs font-semibold text-[#0F766E] transition-all cursor-pointer disabled:opacity-50"
                        title="Trigger LangGraph AI Verification Agent"
                      >
                        {isVerifying ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0D9488]" />
                        ) : (
                          <ShieldCheck className="w-3.5 h-3.5 text-[#0D9488]" />
                        )}
                        <span>{isVerifying ? "Verifying..." : "Verify AI"}</span>
                      </button>

                      <button
                        type="button"
                        className="p-1.5 rounded-xl bg-[#D1F2EE] group-hover:bg-[#0D9488] text-[#0D9488] group-hover:text-white transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
