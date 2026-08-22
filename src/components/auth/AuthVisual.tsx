import React from "react";
import {
  Sparkles,
  ArrowDown,
  Users,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Zap,
  Bot,
} from "lucide-react";

interface AuthVisualProps {
  mode?: "login" | "signup";
}

export const AuthVisual: React.FC<AuthVisualProps> = ({ mode = "login" }) => {
  return (
    <div className="relative flex flex-col justify-between h-full p-8 lg:p-12 overflow-hidden select-none">
      {/* Subtle Atmospheric glow spots */}
      <div className="absolute top-1/4 -left-12 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Logo */}
      <div className="relative z-10 flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-[1px] shadow-lg shadow-blue-500/20">
          <div className="w-full h-full rounded-[15px] bg-slate-950 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-cyan-400" />
          </div>
        </div>
        <div>
          <span className="block text-base font-bold tracking-tight text-white font-mono">
            Meeting-to-Action
          </span>
          <span className="block text-[11px] font-medium text-cyan-400 tracking-wider uppercase">
            AI Follow-through Intelligence
          </span>
        </div>
      </div>

      {/* Main Storytelling Visual */}
      <div className="relative z-10 my-auto py-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400 mb-4">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          Autonomous Post-Meeting Intelligence
        </div>

        <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight mb-3">
          {mode === "login"
            ? "Turn conversations into action."
            : "Start turning meetings into action."}
        </h1>
        <p className="text-sm lg:text-base text-slate-400 max-w-md leading-relaxed mb-8">
          {mode === "login"
            ? "Capture commitments, track ownership, and understand what happens after every meeting."
            : "Create a workspace where every commitment has an owner, deadline, and follow-through."}
        </p>

        {/* Pipeline Diagram Node Flow */}
        <div className="relative bg-slate-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-xl max-w-md shadow-2xl">
          {/* Animated Connecting Line */}
          <div className="absolute left-[39px] top-10 bottom-10 w-[2px] bg-gradient-to-b from-blue-500 via-cyan-400 to-emerald-400 opacity-40" />

          <div className="space-y-5">
            {/* Step 1: Meeting */}
            <div className="flex items-center gap-4 group">
              <div className="relative z-10 w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-400 shadow-md">
                <Users className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    1. Meeting
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">Audio / Video Stream</span>
                </div>
                <p className="text-xs text-slate-400">Team sync, client calls, standups</p>
              </div>
            </div>

            {/* Step 2: AI Understanding */}
            <div className="flex items-center gap-4 group">
              <div className="relative z-10 w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-md animate-pulse-slow">
                <Bot className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                    2. AI Understanding
                  </span>
                  <span className="text-[10px] font-mono text-cyan-400">NLP & Context Graph</span>
                </div>
                <p className="text-xs text-slate-400">Intent extraction, owners, deadlines</p>
              </div>
            </div>

            {/* Step 3: Commitments */}
            <div className="flex items-center gap-4 group">
              <div className="relative z-10 w-9 h-9 rounded-xl bg-violet-500/20 border border-violet-400/40 flex items-center justify-center text-violet-300 shadow-md">
                <Zap className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-violet-300 uppercase tracking-wider">
                    3. Commitments
                  </span>
                  <span className="text-[10px] font-mono text-violet-400">
                    Assigned & Calibrated
                  </span>
                </div>
                <p className="text-xs text-slate-400">Verified action items & milestones</p>
              </div>
            </div>

            {/* Step 4: Follow-through */}
            <div className="flex items-center gap-4 group">
              <div className="relative z-10 w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-md">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    4. Follow-through
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400">Continuous Sync</span>
                </div>
                <p className="text-xs text-slate-400">Code PR match, Slack check, outcome logged</p>
              </div>
            </div>
          </div>

          {/* Floating Live Badge Pills */}
          <div className="absolute -top-3.5 -right-3 px-3 py-1 rounded-full bg-slate-900/90 border border-blue-500/30 text-[11px] font-medium text-blue-300 backdrop-blur-md shadow-lg shadow-blue-500/20 animate-float-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            24 Active Commitments
          </div>

          <div className="absolute top-1/2 -right-6 px-3 py-1 rounded-full bg-slate-900/90 border border-amber-500/30 text-[11px] font-medium text-amber-300 backdrop-blur-md shadow-lg shadow-amber-500/20 animate-float-2 flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-amber-400" />7 Due Soon
          </div>

          <div className="absolute -bottom-3.5 -left-3 px-3 py-1 rounded-full bg-slate-900/90 border border-cyan-500/30 text-[11px] font-medium text-cyan-300 backdrop-blur-md shadow-lg shadow-cyan-500/20 animate-float-3 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            94% Confidence
          </div>
        </div>

        {/* Benefits checklist in signup mode */}
        {mode === "signup" && (
          <div className="grid grid-cols-3 gap-3 mt-6 max-w-md pt-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Capture commitments</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Track deadlines</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Follow progress</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer Meta */}
      <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 border-t border-white/5 pt-4">
        <span>Production AI Architecture</span>
        <span className="font-mono">v2.4 Hackathon Edition</span>
      </div>
    </div>
  );
};
