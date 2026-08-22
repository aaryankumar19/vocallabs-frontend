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
    <div className="relative overflow-hidden rounded-3xl border border-[#B7E6DF] bg-gradient-to-br from-[#F3FFFE] via-[#D1F2EE]/40 to-[#E6F2FF]/60 p-8 sm:p-10 backdrop-blur-2xl shadow-sm">
      {/* Background ambient lighting */}
      <div className="absolute -top-24 -left-24 w-80 h-80 bg-[#D1F2EE]/80 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 right-1/3 w-80 h-80 bg-[#F9EAF0]/60 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left text column */}
        <div className="lg:col-span-7 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#D1F2EE] border border-[#B7E6DF] text-xs font-semibold text-[#0F766E] shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#0D9488] animate-ping" />
            <span>VOCALLABS INTELLIGENCE ENGINE</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0F292B] leading-tight">
            Welcome back, {userName}. <br className="hidden sm:inline" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#0D9488] via-[#0891B2] to-[#0284C7]">
              Conversations into verified action.
            </span>
          </h2>

          <p className="text-sm sm:text-base text-[#115E59] max-w-xl leading-relaxed">
            {groupName ? `Active Workspace: ${groupName}. ` : ""}
            Audio recorded in meetings is transcribed via Whisper STT, and commitment follow-throughs are autonomously evaluated.
          </p>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={onOpenNewMeeting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[#0D9488] via-[#0891B2] to-[#0284C7] hover:from-[#0F766E] hover:to-[#0369A1] shadow-md shadow-[#0D9488]/25 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Process Meeting</span>
            </button>

            <button
              onClick={onViewCommitments}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-[#0F292B] bg-white border border-[#B7E6DF] hover:border-[#0D9488] hover:bg-[#D1F2EE]/30 shadow-2xs transition-all duration-200 cursor-pointer"
            >
              <span>View Tracked Commitments</span>
              <ArrowRight className="w-4 h-4 text-[#0D9488]" />
            </button>
          </div>
        </div>

        {/* Right column: AI Flow Visualization */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="relative w-full max-w-sm rounded-2xl border border-[#B7E6DF] bg-white/90 p-5 backdrop-blur-xl shadow-sm">
            <div className="flex items-center justify-between text-[11px] font-mono font-semibold text-[#115E59] pb-3 border-b border-[#D1F2EE]">
              <span>PIPELINE TELEMETRY</span>
              <span className="text-[#0D9488] flex items-center gap-1 font-bold">
                <Sparkles className="w-3 h-3 text-[#0D9488] animate-spin" /> Live Agent
              </span>
            </div>

            <div className="relative py-3 space-y-2.5">
              {/* Step 1: Sky Blue */}
              <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#E6F2FF] border border-[#B7E6DF]/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-[#0284C7] shadow-2xs">
                    <Video className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-[#0F292B]">
                      LiveKit &amp; Whisper STT
                    </span>
                    <span className="block text-[10px] text-slate-500">Speech-to-Text Transcription</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-[#0284C7] font-semibold border border-[#B7E6DF]/50">
                  Ready
                </span>
              </div>

              <div className="flex justify-center text-[#0D9488] font-bold text-xs">↓</div>

              {/* Step 2: Aqua Seafoam */}
              <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#D1F2EE] border border-[#B7E6DF]">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-[#0D9488] shadow-2xs">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-[#0F292B]">
                      LangGraph Extraction
                    </span>
                    <span className="block text-[10px] text-[#0F766E]">
                      Identifies Action Items &amp; Owners
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0D9488] text-white font-bold">
                  AI Core
                </span>
              </div>

              <div className="flex justify-center text-[#0D9488] font-bold text-xs">↓</div>

              {/* Step 3: Coastal Blush */}
              <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#F9EAF0] border border-[#B7E6DF]/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-[#BE185D] shadow-2xs">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-[#0F292B]">
                      Autonomous Verification
                    </span>
                    <span className="block text-[10px] text-slate-500">
                      {totalCommitments} commitments synchronized
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-[#BE185D] font-semibold border border-[#B7E6DF]/50">
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
