import React from "react";
import {
  Sparkles,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  User,
  Calendar,
} from "lucide-react";
import { ApiCommitment } from "@/lib/api";

interface CommitmentsTableProps {
  commitments: ApiCommitment[];
  onSelectCommitment: (commitment: ApiCommitment) => void;
  title?: string;
  subtitle?: string;
  showAllLink?: boolean;
  onViewAll?: () => void;
}

export const CommitmentsTable: React.FC<CommitmentsTableProps> = ({
  commitments,
  onSelectCommitment,
  title = "Recent Commitments",
  subtitle = "Live commitment tracking and AI verification confidence across meetings.",
  showAllLink = true,
  onViewAll,
}) => {
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
    if (s.includes("review")) {
      return "bg-amber-500/15 text-amber-400 border-amber-500/30";
    }
    return "bg-slate-800 text-slate-300 border-white/10";
  };

  const getConfidencePercentage = (comm: ApiCommitment): number => {
    if (comm.verification_confidence !== null && comm.verification_confidence !== undefined) {
      return Math.round(comm.verification_confidence > 1 ? comm.verification_confidence : comm.verification_confidence * 100);
    }
    if (comm.confidence !== null && comm.confidence !== undefined) {
      return Math.round(comm.confidence > 1 ? comm.confidence : comm.confidence * 100);
    }
    return 85;
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 backdrop-blur-2xl shadow-xl">
      {/* Table Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <h3 className="text-base font-bold tracking-tight text-white">{title}</h3>
          </div>
          <p className="text-xs text-slate-400">{subtitle}</p>
        </div>

        {showAllLink && onViewAll && (
          <button
            onClick={onViewAll}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 self-start sm:self-auto cursor-pointer"
          >
            <span>View All ({commitments.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {commitments.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-400">
          No commitments found. Transcribe a meeting or start a live room to extract commitments.
        </div>
      ) : (
        <>
          {/* Desktop / Tablet Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-slate-950/40 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-6">Commitment</th>
                  <th className="py-3.5 px-4">Owner / Assignee</th>
                  <th className="py-3.5 px-4">Meeting</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">AI Verification</th>
                  <th className="py-3.5 px-6 text-right">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {commitments.map((comm) => {
                  const conf = getConfidencePercentage(comm);
                  return (
                    <tr
                      key={comm.id}
                      onClick={() => onSelectCommitment(comm)}
                      className="group hover:bg-blue-600/10 transition-colors duration-150 cursor-pointer"
                    >
                      {/* Commitment Title */}
                      <td className="py-4 px-6 max-w-xs">
                        <div className="font-semibold text-slate-200 group-hover:text-white line-clamp-1">
                          {comm.title}
                        </div>
                        {comm.description && (
                          <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                            {comm.description}
                          </p>
                        )}
                      </td>

                      {/* Owner */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-600/30 border border-blue-500/30 flex items-center justify-center text-[10px] font-bold text-cyan-300">
                            {(comm.owner || comm.assignee || "AI")[0].toUpperCase()}
                          </div>
                          <span className="font-medium text-slate-300">
                            {comm.owner || comm.assignee || "Assigned by AI"}
                          </span>
                        </div>
                      </td>

                      {/* Meeting */}
                      <td className="py-4 px-4 text-slate-400 whitespace-nowrap">
                        {comm.meeting?.title || "Meeting Session"}
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadge(
                            comm.status,
                          )}`}
                        >
                          {comm.status}
                        </span>
                      </td>

                      {/* Confidence Score */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                conf > 80
                                  ? "bg-gradient-to-r from-blue-500 to-cyan-400"
                                  : conf > 50
                                    ? "bg-amber-400"
                                    : "bg-rose-500"
                              }`}
                              style={{ width: `${conf}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11px] font-bold text-slate-300">
                            {conf}%
                          </span>
                        </div>
                      </td>

                      {/* Created Timestamp */}
                      <td className="py-4 px-6 text-right text-[11px] text-slate-400 font-mono whitespace-nowrap">
                        {new Date(comm.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="md:hidden divide-y divide-white/5 p-2">
            {commitments.map((comm) => {
              const conf = getConfidencePercentage(comm);
              return (
                <div
                  key={comm.id}
                  onClick={() => onSelectCommitment(comm)}
                  className="p-4 rounded-2xl hover:bg-blue-600/10 transition-colors space-y-3 cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-sm text-slate-200">{comm.title}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${getStatusBadge(
                        comm.status,
                      )}`}
                    >
                      {comm.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                    <span>{comm.owner || comm.assignee || "Assigned"}</span>
                    <span className="font-mono text-cyan-400">{conf}% Verified</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
