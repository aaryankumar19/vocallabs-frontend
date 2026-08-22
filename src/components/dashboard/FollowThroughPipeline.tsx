import React, { useState } from "react";
import {
  Sparkles,
  Video,
  User,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import { ApiCommitment } from "@/lib/api";

interface FollowThroughPipelineProps {
  commitments: ApiCommitment[];
  onSelectCommitment: (commitment: ApiCommitment) => void;
}

export const FollowThroughPipeline: React.FC<FollowThroughPipelineProps> = ({
  commitments,
  onSelectCommitment,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (commitments.length === 0) {
    return null;
  }

  const activeItem = commitments[selectedIndex] ?? commitments[0];
  if (!activeItem) return null;

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
    return "bg-[#D1F2EE]/50 text-[#115E59] border-[#B7E6DF]";
  };

  const getConf = (c: ApiCommitment) => {
    if (c.verification_confidence !== null && c.verification_confidence !== undefined) {
      return Math.round(
        c.verification_confidence > 1 ? c.verification_confidence : c.verification_confidence * 100,
      );
    }
    if (c.confidence !== null && c.confidence !== undefined) {
      return Math.round(c.confidence > 1 ? c.confidence : c.confidence * 100);
    }
    return 90;
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-[#B7E6DF] bg-white/90 p-6 sm:p-8 shadow-sm">
      {/* Header with selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#D1F2EE]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#0D9488] animate-pulse" />
            <h3 className="text-lg font-bold tracking-tight text-[#0F292B]">
              Commitment Follow-Through Trace
            </h3>
          </div>
          <p className="text-xs text-[#115E59]">Live telemetry and agent evaluation pipeline.</p>
        </div>

        {/* Trace Item Selector tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#D1F2EE] border border-[#B7E6DF] overflow-x-auto">
          {commitments.slice(0, 3).map((item, idx) => (
            <button
              key={item.id}
              onClick={() => setSelectedIndex(idx)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedIndex === idx
                  ? "bg-[#0D9488] text-white shadow-xs"
                  : "text-[#115E59] hover:text-[#0F292B] hover:bg-[#B7E6DF]/50"
              }`}
            >
              {item.title.slice(0, 22)}...
            </button>
          ))}
        </div>
      </div>

      {/* End-to-End Pipeline Visualization Flow */}
      <div className="py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 relative">
          {/* Step 1: Meeting Source (Airy Sky Blue) */}
          <div className="relative rounded-2xl bg-[#E6F2FF]/70 border border-[#B7E6DF] p-4 flex flex-col justify-between group hover:border-[#0284C7] transition-all shadow-2xs">
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[#0369A1] font-semibold mb-2">
              <span>1. Source Meeting</span>
              <Video className="w-3.5 h-3.5 text-[#0284C7]" />
            </div>
            <div>
              <span className="block text-xs font-bold text-[#0F292B] mb-0.5">
                {activeItem.meeting?.title || "Meeting Session"}
              </span>
              <span className="block text-[11px] text-slate-500">Whisper STT Transcribed</span>
            </div>
            <div className="mt-3 pt-2 border-t border-[#B7E6DF]/70 text-[10px] text-[#0284C7] font-mono font-medium">
              Captured in meeting
            </div>
          </div>

          {/* Step 2: Commitment (Soft Aqua) */}
          <div className="relative rounded-2xl bg-[#D1F2EE]/70 border border-[#B7E6DF] p-4 flex flex-col justify-between shadow-2xs">
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[#0F766E] font-semibold mb-2">
              <span>2. Action Item</span>
              <Sparkles className="w-3.5 h-3.5 text-[#0D9488]" />
            </div>
            <div>
              <span className="block text-xs font-bold text-[#0F292B] line-clamp-2 mb-0.5">
                {activeItem.title}
              </span>
              {activeItem.description && (
                <span className="block text-[10px] text-slate-500 line-clamp-1">
                  {activeItem.description}
                </span>
              )}
            </div>
            <div className="mt-3 pt-2 border-t border-[#B7E6DF]/70 text-[10px] text-[#0D9488] font-mono font-medium">
              Extracted by Agent
            </div>
          </div>

          {/* Step 3: Owner (Coastal Blush) */}
          <div className="relative rounded-2xl bg-[#F9EAF0]/70 border border-[#B7E6DF] p-4 flex flex-col justify-between group hover:border-[#BE185D] transition-all shadow-2xs">
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[#9D174D] font-semibold mb-2">
              <span>3. Accountability</span>
              <User className="w-3.5 h-3.5 text-[#BE185D]" />
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white border border-[#B7E6DF] flex items-center justify-center font-bold text-[#BE185D] text-xs shadow-2xs">
                {(activeItem.owner || activeItem.assignee || "AI")?.charAt(0).toUpperCase() ?? "A"}
              </div>
              <div>
                <span className="block text-xs font-bold text-[#0F292B]">
                  {activeItem.owner || activeItem.assignee || "Assigned by AI"}
                </span>
                <span className="block text-[10px] text-slate-500">Team Member</span>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-[#B7E6DF]/70 text-[10px] text-slate-500 font-mono">
              Accountable Owner
            </div>
          </div>

          {/* Step 4: Status & Confidence (Ocean Breeze Mint) */}
          <div className="relative rounded-2xl bg-gradient-to-br from-[#D1F2EE] to-[#E6F2FF]/60 border border-[#0D9488] p-4 flex flex-col justify-between shadow-2xs">
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[#0F766E] font-semibold mb-2">
              <span>4. AI Verification</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-[#0D9488]" />
            </div>
            <div>
              <span
                className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadge(
                  activeItem.status,
                )} mb-1.5`}
              >
                {activeItem.status}
              </span>
              <div className="flex items-center gap-1.5 text-[11px] text-[#0F766E] font-semibold">
                <Sparkles className="w-3 h-3 text-[#0D9488]" />
                <span className="font-mono">{getConf(activeItem)}% Confidence</span>
              </div>
            </div>
            <button
              onClick={() => onSelectCommitment(activeItem)}
              className="mt-3 pt-2 border-t border-[#B7E6DF] flex items-center justify-between text-[10px] text-[#0F292B] hover:text-[#0D9488] font-bold group cursor-pointer"
            >
              <span>Inspect Commitment</span>
              <ChevronRight className="w-3 h-3 text-[#0D9488] group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
