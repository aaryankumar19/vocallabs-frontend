import React, { useState } from "react";
import {
  X,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldCheck,
  ArrowRight,
  User,
  Calendar,
  Loader2,
} from "lucide-react";
import { ApiCommitment, verifyCommitment } from "@/lib/api";
import { toast } from "sonner";

interface CommitmentDrawerProps {
  commitment: ApiCommitment | null;
  onClose: () => void;
  onCommitmentUpdated?: () => void;
}

export const CommitmentDrawer: React.FC<CommitmentDrawerProps> = ({
  commitment,
  onClose,
  onCommitmentUpdated,
}) => {
  const [isVerifying, setIsVerifying] = useState(false);

  if (!commitment) return null;

  const getStatusBadge = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s.includes("complete") || s === "done") {
      return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    }
    if (s.includes("progress") || s === "ongoing") {
      return "bg-blue-500/15 text-blue-400 border-blue-500/30";
    }
    if (s.includes("risk") || s === "blocked") {
      return "bg-rose-500/15 text-rose-400 border-rose-500/30";
    }
    return "bg-amber-500/15 text-amber-400 border-amber-500/30";
  };

  const getConfidence = (): number => {
    if (commitment.verification_confidence !== null && commitment.verification_confidence !== undefined) {
      return Math.round(
        commitment.verification_confidence > 1
          ? commitment.verification_confidence
          : commitment.verification_confidence * 100,
      );
    }
    if (commitment.confidence !== null && commitment.confidence !== undefined) {
      return Math.round(
        commitment.confidence > 1 ? commitment.confidence : commitment.confidence * 100,
      );
    }
    return 88;
  };

  const conf = getConfidence();
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (conf / 100) * circumference;

  const handleRunVerification = async () => {
    try {
      setIsVerifying(true);
      await verifyCommitment(commitment.id);
      toast.success("AI Verification Agent triggered and evaluated telemetry!");
      if (onCommitmentUpdated) onCommitmentUpdated();
    } catch (err: any) {
      toast.error(err.message || "Failed to trigger verification agent");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity animate-in fade-in"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-lg bg-[#070D1E]/95 border-l border-white/10 backdrop-blur-2xl p-6 sm:p-8 flex flex-col justify-between overflow-y-auto shadow-2xl shadow-black animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-6">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  Commitment Detail & Telemetry
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Commitment Title & Status */}
            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(
                    commitment.status,
                  )}`}
                >
                  {commitment.status}
                </span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-white leading-snug">
                {commitment.title}
              </h2>
              {commitment.description && (
                <p className="text-xs text-slate-300 leading-relaxed">{commitment.description}</p>
              )}
            </div>

            {/* Metadata Card: Owner & Source */}
            <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-950/70 border border-white/5 mb-6 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-600/25 border border-blue-500/30 flex items-center justify-center font-bold text-cyan-300">
                  {(commitment.owner || commitment.assignee || "AI")[0].toUpperCase()}
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400">Assigned To</span>
                  <span className="font-bold text-white">
                    {commitment.owner || commitment.assignee || "Assigned by AI"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400">Created</span>
                  <span className="font-bold text-slate-200">
                    {new Date(commitment.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {commitment.meeting && (
                <div className="col-span-2 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                  <span>
                    Meeting: <strong className="text-slate-200">{commitment.meeting.title}</strong>
                  </span>
                  <span>ID: {commitment.meeting_id.slice(0, 8)}...</span>
                </div>
              )}
            </div>

            {/* Large Animated Circular Confidence Indicator */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-950/40 via-slate-950/70 to-cyan-950/30 border border-blue-500/25 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-semibold block mb-1">
                    AI Calibration Score
                  </span>
                  <h4 className="text-base font-bold text-white mb-1">Autonomous Confidence</h4>
                  <p className="text-xs text-slate-400 max-w-[220px]">
                    Extracted and scored by the VocalLabs LangGraph Commitment Agent.
                  </p>
                </div>

                {/* SVG Gauge */}
                <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r={radius}
                      className="text-slate-800"
                      strokeWidth="8"
                      stroke="currentColor"
                      fill="transparent"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r={radius}
                      className="text-cyan-400 transition-all duration-1000 ease-out"
                      strokeWidth="8"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-extrabold font-mono text-white leading-none">
                      {conf}%
                    </span>
                    <span className="text-[9px] uppercase tracking-wider text-cyan-400 font-bold">
                      Confidence
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Drawer Actions Footer */}
          <div className="pt-4 border-t border-white/10 grid grid-cols-2 gap-3">
            <button
              onClick={handleRunVerification}
              disabled={isVerifying}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-lg shadow-blue-600/20 disabled:opacity-50 transition-all cursor-pointer text-center"
            >
              {isVerifying ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5" />
              )}
              Run Verification
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-200 bg-slate-900 border border-white/10 hover:border-white/20 transition-all cursor-pointer text-center"
            >
              Close Drawer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
