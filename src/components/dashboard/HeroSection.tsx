import React from "react";
import { Sparkles, Plus, ArrowRight, Video, ShieldCheck } from "lucide-react";
import { getAuthUser } from "@/lib/auth";

interface HeroSectionProps {
  onOpenNewMeeting: () => void;
  onViewCommitments: () => void;
  groupName?: string;
  totalCommitments?: number;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onOpenNewMeeting,
  onViewCommitments,
  groupName,
  totalCommitments = 0,
}) => {
  const user = getAuthUser();
  const userName = user?.name || user?.email?.split("@")[0] || "Team";

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-slate-900/90 via-[#091228]/80 to-slate-950/90 p-8 sm:p-10 backdrop-blur-2xl shadow-2xl">
      {/* Background ambient lighting */}
      <div className="absolute -top-24 -left-24 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 right-1/3 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left text column */}
        <div className="lg:col-span-7 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/25 text-xs font-semibold text-cyan-300">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>VOCALLABS INTELLIGENCE ENGINE</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Welcome back, {userName}. <br className="hidden sm:inline" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-300">
              Conversations into verified action.
            </span>
          </h2>

          <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
            {groupName ? `Active Workspace: ${groupName}. ` : ""}
            Audio recorded in meetings is transcribed via Whisper STT, and commitment follow-throughs are autonomously evaluated.
          </p>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={onOpenNewMeeting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-lg shadow-blue-600/30 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Process Meeting</span>
            </button>

            <button
              onClick={onViewCommitments}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-200 bg-slate-900/80 border border-white/10 hover:border-white/25 hover:bg-slate-800 transition-all duration-200 cursor-pointer"
            >
              <span>View Tracked Commitments</span>
              <ArrowRight className="w-4 h-4 text-cyan-400" />
            </button>
          </div>
        </div>

        {/* Right column: AI Flow Visualization */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="relative w-full max-w-sm rounded-2xl border border-blue-500/20 bg-slate-950/60 p-5 backdrop-blur-xl shadow-xl">
            <div className="flex items-center justify-between text-[11px] font-mono font-semibold text-slate-400 pb-3 border-b border-white/5">
              <span>PIPELINE TELEMETRY</span>
              <span className="text-cyan-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 animate-spin" /> Live Agent
              </span>
            </div>

            <div className="relative py-4 space-y-3">
              <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-blue-950/40 border border-blue-500/20">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
                    <Video className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-200">
                      LiveKit & Whisper STT
                    </span>
                    <span className="block text-[10px] text-slate-400">Speech-to-Text Transcription</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-300">
                  Ready
                </span>
              </div>

              <div className="flex justify-center text-cyan-400 opacity-60">↓</div>

              <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-300">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-cyan-200">
                      LangGraph Extraction
                    </span>
                    <span className="block text-[10px] text-cyan-400/80">
                      Identifies Action Items & Owners
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">
                  AI Core
                </span>
              </div>

              <div className="flex justify-center text-emerald-400 opacity-60">↓</div>

              <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/20">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-emerald-200">
                      Autonomous Verification
                    </span>
                    <span className="block text-[10px] text-slate-400">
                      {totalCommitments} commitments synchronized
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold">
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
