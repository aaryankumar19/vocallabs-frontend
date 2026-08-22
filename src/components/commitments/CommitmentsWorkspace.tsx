import React, { useState } from "react";
import {
  Sparkles,
  Search,
  CheckSquare,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Filter,
} from "lucide-react";
import { ApiCommitment } from "@/lib/api";
import { CommitmentsTable } from "@/components/dashboard/CommitmentsTable";

interface CommitmentsWorkspaceProps {
  commitments: ApiCommitment[];
  onSelectCommitment: (comm: ApiCommitment) => void;
}

export const CommitmentsWorkspace: React.FC<CommitmentsWorkspaceProps> = ({
  commitments,
  onSelectCommitment,
}) => {
  const [filterTab, setFilterTab] = useState<"all" | "in-progress" | "completed" | "at-risk">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"created" | "confidence">("created");

  const filteredCommitments = commitments
    .filter((comm) => {
      const status = (comm.status || "").toLowerCase();
      if (filterTab === "in-progress" && !status.includes("progress") && status !== "ongoing") {
        return false;
      }
      if (filterTab === "completed" && !status.includes("complete") && status !== "done") {
        return false;
      }
      if (filterTab === "at-risk" && !status.includes("risk") && !status.includes("blocked") && !status.includes("pending")) {
        return false;
      }

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const titleMatch = (comm.title || "").toLowerCase().includes(q);
        const ownerMatch = (comm.owner || comm.assignee || "").toLowerCase().includes(q);
        const meetingMatch = (comm.meeting?.title || "").toLowerCase().includes(q);
        return titleMatch || ownerMatch || meetingMatch;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "confidence") {
        const confA = a.verification_confidence ?? a.confidence ?? 0;
        const confB = b.verification_confidence ?? b.confidence ?? 0;
        return confB - confA;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl border border-[#B7E6DF] bg-white/90 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#0D9488]" />
            <h2 className="text-xl font-bold tracking-tight text-[#0F292B]">Commitments Workspace</h2>
          </div>
          <p className="text-xs text-[#115E59]">
            Autonomous post-meeting tracking, evidence verification, and AI follow-through.
          </p>
        </div>

        {/* View Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#D1F2EE] border border-[#B7E6DF] overflow-x-auto">
          {[
            { id: "all", label: `All (${commitments.length})` },
            {
              id: "in-progress",
              label: `In Progress (${commitments.filter((c) => (c.status || "").toLowerCase().includes("progress")).length})`,
            },
            {
              id: "completed",
              label: `Completed (${commitments.filter((c) => (c.status || "").toLowerCase().includes("complete")).length})`,
            },
            {
              id: "at-risk",
              label: `Pending / At Risk (${commitments.filter((c) => !(c.status || "").toLowerCase().includes("complete") && !(c.status || "").toLowerCase().includes("progress")).length})`,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                filterTab === tab.id
                  ? "bg-[#0D9488] text-white shadow-xs font-bold"
                  : "text-[#115E59] hover:text-[#0F292B] hover:bg-[#B7E6DF]/50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search & Sort Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by title, owner, meeting..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-[#B7E6DF] text-xs text-[#0F292B] placeholder-slate-400 focus:outline-none focus:border-[#0D9488] focus:ring-2 focus:ring-[#D1F2EE] shadow-2xs transition-all"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-xs text-[#115E59]">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-white border border-[#B7E6DF] text-xs text-[#0F292B] focus:outline-none focus:border-[#0D9488] shadow-2xs cursor-pointer"
          >
            <option value="created">Latest Created</option>
            <option value="confidence">Highest AI Confidence</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <CommitmentsTable
        commitments={filteredCommitments}
        onSelectCommitment={onSelectCommitment}
        title="Synchronized Team Commitments"
        subtitle={`Showing ${filteredCommitments.length} commitments.`}
        showAllLink={false}
      />
    </div>
  );
};
