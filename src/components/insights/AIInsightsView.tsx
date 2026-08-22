import React from "react";
import {
  Sparkles,
  AlertTriangle,
  Clock,
  TrendingUp,
  CheckCircle2,
  ShieldAlert,
  BarChart3,
  ArrowRight,
  Layers,
  Users,
} from "lucide-react";
import { Commitment } from "@/data/mockData";

interface AIInsightsViewProps {
  commitments: Commitment[];
  onSelectCommitment: (comm: Commitment) => void;
}

export const AIInsightsView: React.FC<AIInsightsViewProps> = ({
  commitments,
  onSelectCommitment,
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-3xl border border-white/10 bg-slate-900/70 backdrop-blur-2xl">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <h2 className="text-xl font-bold tracking-tight text-white">
            AI Intelligence & Insights
          </h2>
        </div>
        <p className="text-xs text-slate-400">
          Understand where commitments need attention, workload bottlenecks, and completion
          forecasts.
        </p>
      </div>

      {/* 3 Key Attention Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1 */}
        <div className="relative overflow-hidden rounded-3xl border border-rose-500/30 bg-gradient-to-br from-rose-950/30 via-slate-900/60 to-slate-950/80 p-6 backdrop-blur-xl space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300">
              ACTION NEEDED
            </span>
          </div>
          <div>
            <span className="block text-2xl font-extrabold font-mono text-white mb-1">
              3 commitments need attention
            </span>
            <p className="text-xs text-slate-400">
              Infrastructure quota blocker identified on AWS us-east-1 for Friday deployment.
            </p>
          </div>
        </div>

        {/* Card 2 */}
        <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-950/30 via-slate-900/60 to-slate-950/80 p-6 backdrop-blur-xl space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Clock className="w-5 h-5" />
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300">
              UPCOMING
            </span>
          </div>
          <div>
            <span className="block text-2xl font-extrabold font-mono text-white mb-1">
              7 commitments due this week
            </span>
            <p className="text-xs text-slate-400">
              4 engineering tasks, 2 API specs, 1 design review targeted for completion.
            </p>
          </div>
        </div>

        {/* Card 3 */}
        <div className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/30 via-slate-900/60 to-slate-950/80 p-6 backdrop-blur-xl space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <TrendingUp className="w-5 h-5" />
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300">
              89% RELIABILITY
            </span>
          </div>
          <div>
            <span className="block text-2xl font-extrabold font-mono text-white mb-1">
              Most tasks progressing normally
            </span>
            <p className="text-xs text-slate-400">
              Team velocity up +12% following autonomous PR correlation integrations.
            </p>
          </div>
        </div>
      </div>

      {/* Commitment Health Breakdown Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Health Gauge & Distribution */}
        <div className="lg:col-span-7 rounded-3xl border border-white/10 bg-slate-900/70 p-6 sm:p-8 backdrop-blur-2xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Commitment Health Overview</h3>
              </div>
              <p className="text-xs text-slate-400">
                Calculated by Autonomous Follow-through Agent across 24 monitored items.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Overall: Healthy (89%)
            </span>
          </div>

          {/* Health Segment Bar */}
          <div className="space-y-2">
            <div className="h-4 w-full rounded-full bg-slate-950 overflow-hidden flex p-0.5 gap-1">
              <div
                className="h-full rounded-full bg-emerald-500 w-[60%]"
                title="60% Completed / Likely Done"
              />
              <div className="h-full rounded-full bg-blue-500 w-[25%]" title="25% In Progress" />
              <div className="h-full rounded-full bg-amber-500 w-[10%]" title="10% Needs Review" />
              <div className="h-full rounded-full bg-rose-500 w-[5%]" title="5% At Risk" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-300">
                  Done / Likely: <strong>60%</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-slate-300">
                  In Progress: <strong>25%</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-slate-300">
                  In Review: <strong>10%</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="text-slate-300">
                  At Risk: <strong>5%</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Department Breakdown */}
          <div className="pt-4 border-t border-white/5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Department Execution Health
            </h4>
            <div className="space-y-3">
              {[
                { name: "Engineering Core", count: 12, rate: 94, color: "bg-blue-500" },
                { name: "Product & APIs", count: 6, rate: 88, color: "bg-cyan-400" },
                { name: "Security & Enterprise SSO", count: 4, rate: 75, color: "bg-violet-400" },
                { name: "UI / UX Design Kit", count: 2, rate: 98, color: "bg-emerald-400" },
              ].map((dep, idx) => (
                <div key={idx} className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="font-semibold">
                      {dep.name} ({dep.count} tasks)
                    </span>
                    <span className="font-mono font-bold text-slate-200">{dep.rate}% On-Time</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-950 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${dep.color}`}
                      style={{ width: `${dep.rate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Bottleneck Analysis & Autonomous Suggestions */}
        <div className="lg:col-span-5 rounded-3xl border border-white/10 bg-slate-900/70 p-6 sm:p-8 backdrop-blur-2xl space-y-5">
          <div className="flex items-center gap-2 text-cyan-400">
            <Sparkles className="w-4 h-4" />
            <h3 className="text-base font-bold text-white">Autonomous Recommendations</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-rose-400 font-bold">
                High Priority Resolution
              </span>
              <p className="text-slate-200 font-semibold leading-snug">
                Request AWS Service Quota increase for us-east-1 to prevent Friday deploy delay.
              </p>
              <p className="text-slate-400 text-[11px]">
                Committed by Aaryan in Engineering Sync. 48 hours remaining.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
                Review Ready
              </span>
              <p className="text-slate-200 font-semibold leading-snug">
                OpenAPI Spec v2 drafted by Rahul is awaiting partner confirmation.
              </p>
              <p className="text-slate-400 text-[11px]">Estimated completion: Tomorrow 12:00 PM.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
