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

  const activeItem = commitments[selectedIndex] || commitments[0];

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

  const getConf = (c: ApiCommitment) => {
    if (c.verification_confidence !== null && c.verification_confidence !== undefined) {
      return Math.round(c.verification_confidence > 1 ? c.verification_confidence : c.verification_confidence * 100);
    }
    if (c.confidence !== null && c.confidence !== undefined) {
      return Math.round(c.confidence > 1 ? c.confidence : c.confidence * 100);
    }
    return 90;
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 p-6 sm:p-8 backdrop-blur-2xl shadow-xl">
      {/* Background ambient gradient */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-600/10 via-cyan-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Header with selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <h3 className="text-lg font-bold tracking-tight text-white">
              Commitment Follow-Through Trace
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Live telemetry and agent evaluation pipeline.
          </p>
        </div>

        {/* Trace Item Selector tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950/70 border border-white/10 overflow-x-auto">
          {commitments.slice(0, 3).map((item, idx) => (
            <button
              key={item.id}
              onClick={() => setSelectedIndex(idx)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedIndex === idx
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              {item.title.slice(0, 20)}...
            </button>
          ))}
        </div>
      </div>

      {/* End-to-End Pipeline Visualization Flow */}
      <div className="py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 relative">
          {/* Step 1: Meeting Source */}
          <div className="relative rounded-2xl bg-slate-950/60 border border-white/5 p-4 flex flex-col justify-between group hover:border-blue-500/30 transition-all">
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2">
              <span>1. Source Meeting</span>
              <Video className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div>
              <span className="block text-xs font-bold text-white mb-0.5">
                {activeItem.meeting?.title || "Meeting Session"}
              </span>
              <span className="block text-[11px] text-slate-400">Whisper STT Transcribed</span>
            </div>
            <div className="mt-3 pt-2 border-t border-white/5 text-[10px] text-cyan-400 font-mono">
              Captured in meeting
            </div>
          </div>

          {/* Step 2: Commitment */}
          <div className="relative rounded-2xl bg-slate-950/60 border border-blue-500/25 p-4 flex flex-col justify-between shadow-lg shadow-blue-500/5">
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-blue-400 mb-2">
              <span>2. Action Item</span>
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div>
              <span className="block text-xs font-bold text-slate-100 line-clamp-2 mb-0.5">
                {activeItem.title}
              </span>
              {activeItem.description && (
                <span className="block text-[10px] text-slate-400 line-clamp-1">{activeItem.description}</span>
              )}
            </div>
            <div className="mt-3 pt-2 border-t border-white/5 text-[10px] text-blue-300 font-mono">
              Extracted by Agent
            </div>
          </div>

          {/* Step 3: Owner */}
          <div className="relative rounded-2xl bg-slate-950/60 border border-white/5 p-4 flex flex-col justify-between group hover:border-blue-500/30 transition-all">
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2">
              <span>3. Accountability</span>
              <User className="w-3.5 h-3.5 text-violet-400" />
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-500/30 flex items-center justify-center font-bold text-cyan-300 text-xs">
                {(activeItem.owner || activeItem.assignee || "AI")[0].toUpperCase()}
              </div>
              <div>
                <span className="block text-xs font-bold text-white">
                  {activeItem.owner || activeItem.assignee || "Assigned by AI"}
                </span>
                <span className="block text-[10px] text-slate-400">Team Member</span>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-white/5 text-[10px] text-slate-400 font-mono">
              Accountable Owner
            </div>
          </div>

          {/* Step 4: Status & Confidence */}
          <div className="relative rounded-2xl bg-gradient-to-br from-slate-950 to-blue-950/40 border border-cyan-500/30 p-4 flex flex-col justify-between shadow-xl shadow-cyan-500/5">
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-cyan-400 mb-2">
              <span>4. AI Verification</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div>
              <span
                className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border ${getStatusBadge(
                  activeItem.status,
                )} mb-1.5`}
              >
                {activeItem.status}
              </span>
              <div className="flex items-center gap-1.5 text-[11px] text-cyan-300">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span className="font-mono font-bold">{getConf(activeItem)}% Confidence</span>
              </div>
            </div>
            <button
              onClick={() => onSelectCommitment(activeItem)}
              className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-200 hover:text-white font-semibold group cursor-pointer"
            >
              <span>Inspect Commitment</span>
              <ChevronRight className="w-3 h-3 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
