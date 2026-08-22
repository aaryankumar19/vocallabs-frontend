import React from "react";
import { Bot, Sparkles, Activity, ShieldCheck, Zap } from "lucide-react";

interface AIAgentPanelProps {
  compact?: boolean;
  className?: string;
}

export const AIAgentPanel: React.FC<AIAgentPanelProps> = ({ compact = false, className = "" }) => {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-950/40 via-slate-900/60 to-slate-950/80 p-4 backdrop-blur-xl shadow-xl ${className}`}
    >
      {/* Background glow */}
      <div className="absolute -top-12 -right-12 w-28 h-28 bg-blue-500/15 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-cyan-500/10 rounded-full blur-xl pointer-events-none" />

      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-400/30 text-blue-400">
            <Bot className="w-4 h-4" />
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                AI Agent
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                ACTIVE
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Following commitments</p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-slate-500 font-mono">Synced 2m ago</span>
        </div>
      </div>

      {/* Status metrics */}
      {!compact && (
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-white/5">
          <div className="bg-slate-900/60 rounded-lg p-2 border border-white/5 text-center">
            <span className="block text-xs font-mono font-bold text-blue-400">24</span>
            <span className="text-[10px] text-slate-400">Monitored</span>
          </div>
          <div className="bg-slate-900/60 rounded-lg p-2 border border-white/5 text-center">
            <span className="block text-xs font-mono font-bold text-amber-400">7</span>
            <span className="text-[10px] text-slate-400">Due Soon</span>
          </div>
          <div className="bg-slate-900/60 rounded-lg p-2 border border-white/5 text-center">
            <span className="block text-xs font-mono font-bold text-rose-400">3</span>
            <span className="text-[10px] text-slate-400">Attention</span>
          </div>
        </div>
      )}

      {/* Live trace stream indicator */}
      <div className="mt-3 flex items-center gap-2 px-2 py-1.5 rounded-lg bg-blue-950/30 border border-blue-500/15 text-[11px] text-slate-300">
        <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0 animate-pulse" />
        <span className="truncate text-slate-300">Auto-tracking GitHub PR #142 & calendar</span>
      </div>
    </div>
  );
};
