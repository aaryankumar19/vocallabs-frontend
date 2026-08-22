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
      return "bg-[#D1F2EE] text-[#0F766E] border-[#B7E6DF]";
    }
    if (s.includes("progress") || s === "ongoing") {
      return "bg-[#E6F2FF] text-[#0369A1] border-[#B7E6DF]";
    }
    if (s.includes("risk") || s === "blocked") {
      return "bg-[#F9EAF0] text-[#9D174D] border-[#B7E6DF]";
    }
    if (s.includes("review")) {
      return "bg-[#F9EAF0] text-[#BE185D] border-[#B7E6DF]";
    }
    return "bg-[#F3FFFE] text-[#115E59] border-[#B7E6DF]";
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
    <div className="relative overflow-hidden rounded-3xl border border-[#B7E6DF] bg-white/95 shadow-sm">
      {/* Table Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 border-b border-[#D1F2EE]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#0D9488]" />
            <h3 className="text-base font-bold tracking-tight text-[#0F292B]">{title}</h3>
          </div>
          <p className="text-xs text-[#115E59]">{subtitle}</p>
        </div>

        {showAllLink && onViewAll && (
          <button
            onClick={onViewAll}
            className="text-xs font-semibold text-[#0D9488] hover:text-[#0F766E] flex items-center gap-1 self-start sm:self-auto cursor-pointer"
          >
            <span>View All ({commitments.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {commitments.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-500">
          No commitments found. Transcribe a meeting or start a live room to extract commitments.
        </div>
      ) : (
        <>
          {/* Desktop / Tablet Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#D1F2EE] bg-[#F3FFFE] text-[10px] font-mono uppercase tracking-wider text-[#115E59]">
                  <th className="py-3.5 px-6">Commitment</th>
                  <th className="py-3.5 px-4">Owner / Assignee</th>
                  <th className="py-3.5 px-4">Meeting</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">AI Verification</th>
                  <th className="py-3.5 px-6 text-right">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D1F2EE] text-xs">
                {commitments.map((comm) => {
                  const conf = getConfidencePercentage(comm);
                  return (
                    <tr
                      key={comm.id}
                      onClick={() => onSelectCommitment(comm)}
                      className="group hover:bg-[#D1F2EE]/30 transition-colors duration-150 cursor-pointer"
                    >
                      {/* Commitment Title */}
                      <td className="py-4 px-6 max-w-xs">
                        <div className="font-semibold text-[#0F292B] group-hover:text-[#0D9488] transition-colors line-clamp-1">
                          {comm.title}
                        </div>
                        {comm.description && (
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                            {comm.description}
                          </p>
                        )}
                      </td>

                      {/* Owner */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#D1F2EE] border border-[#B7E6DF] flex items-center justify-center text-[10px] font-bold text-[#0D9488]">
                            {(comm.owner || comm.assignee || "AI")?.charAt(0).toUpperCase() ?? "A"}
                          </div>
                          <span className="font-medium text-[#0F292B]">
                            {comm.owner || comm.assignee || "Assigned by AI"}
                          </span>
                        </div>
                      </td>

                      {/* Meeting */}
                      <td className="py-4 px-4 text-slate-600 whitespace-nowrap">
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
                          <div className="w-16 h-1.5 rounded-full bg-[#D1F2EE] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[#0D9488] to-[#0284C7]"
                              style={{ width: `${conf}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11px] font-bold text-[#0F292B]">
                            {conf}%
                          </span>
                        </div>
                      </td>

                      {/* Created Timestamp */}
                      <td className="py-4 px-6 text-right text-[11px] text-slate-500 font-mono whitespace-nowrap">
                        {new Date(comm.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="md:hidden divide-y divide-[#D1F2EE] p-2">
            {commitments.map((comm) => {
              const conf = getConfidencePercentage(comm);
              return (
                <div
                  key={comm.id}
                  onClick={() => onSelectCommitment(comm)}
                  className="p-4 rounded-2xl hover:bg-[#D1F2EE]/30 transition-colors space-y-3 cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-sm text-[#0F292B]">{comm.title}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${getStatusBadge(
                        comm.status,
                      )}`}
                    >
                      {comm.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                    <span>{comm.owner || comm.assignee || "Assigned"}</span>
                    <span className="font-mono text-[#0D9488] font-semibold">{conf}% Verified</span>
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
