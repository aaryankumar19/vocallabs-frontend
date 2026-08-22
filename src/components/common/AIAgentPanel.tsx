import React from "react";
import { Bot, Sparkles, Activity, ShieldCheck, Zap } from "lucide-react";

interface AIAgentPanelProps {
  compact?: boolean;
  className?: string;
}

export const AIAgentPanel: React.FC<AIAgentPanelProps> = ({ compact = false, className = "" }) => {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-indigo-200/80 bg-white p-4 shadow-sm ${className}`}
    >
      {/* Background glow */}
      <div className="absolute -top-12 -right-12 w-28 h-28 bg-indigo-100/60 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-sky-100/50 rounded-full blur-xl pointer-events-none" />

      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600">
            <Bot className="w-4 h-4" />
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                AI Agent
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                ACTIVE
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Following commitments</p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-slate-400 font-mono">Synced 2m ago</span>
        </div>
      </div>

      {/* Status metrics */}
      {!compact && (
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100">
          <div className="bg-slate-50 rounded-lg p-2 border border-slate-200/80 text-center">
            <span className="block text-xs font-mono font-bold text-indigo-600">24</span>
            <span className="text-[10px] text-slate-500">Monitored</span>
          </div>
          <div className="bg-slate-50 rounded-lg p-2 border border-slate-200/80 text-center">
            <span className="block text-xs font-mono font-bold text-amber-600">7</span>
            <span className="text-[10px] text-slate-500">Due Soon</span>
          </div>
          <div className="bg-slate-50 rounded-lg p-2 border border-slate-200/80 text-center">
            <span className="block text-xs font-mono font-bold text-rose-600">3</span>
            <span className="text-[10px] text-slate-500">Attention</span>
          </div>
        </div>
      )}

      {/* Live trace stream indicator */}
      <div className="mt-3 flex items-center gap-2 px-2 py-1.5 rounded-lg bg-indigo-50/70 border border-indigo-100 text-[11px] text-slate-700">
        <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0 animate-pulse" />
        <span className="truncate text-slate-700">
          Auto-tracking commitments &amp; action items
        </span>
      </div>
    </div>
  );
};
