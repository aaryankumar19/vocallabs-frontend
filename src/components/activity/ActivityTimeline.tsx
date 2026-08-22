import React, { useState } from "react";
import {
  Sparkles,
  Bot,
  Clock,
  CheckCircle2,
  AlertTriangle,
  GitPullRequest,
  User,
  Activity,
  Filter,
  RefreshCw,
} from "lucide-react";
import { FeedActivity } from "@/data/mockData";

interface ActivityTimelineProps {
  activities: FeedActivity[];
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ activities }) => {
  const [filterType, setFilterType] = useState<"all" | "ai" | "deadline" | "commitment">("all");

  const filtered = activities.filter((act) => {
    if (filterType === "all") return true;
    return act.type === filterType;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case "ai":
        return <Sparkles className="w-4 h-4 text-cyan-400" />;
      case "deadline":
        return <Clock className="w-4 h-4 text-amber-400" />;
      case "review":
        return <AlertTriangle className="w-4 h-4 text-rose-400" />;
      case "commitment":
      default:
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    }
  };

  const getBadgeStyle = (type: string) => {
    switch (type) {
      case "ai":
        return "bg-blue-500/15 text-cyan-300 border-blue-500/30";
      case "deadline":
        return "bg-amber-500/15 text-amber-300 border-amber-500/30";
      case "review":
        return "bg-rose-500/15 text-rose-300 border-rose-500/30";
      case "commitment":
      default:
        return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl border border-white/10 bg-slate-900/70 backdrop-blur-2xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <h2 className="text-xl font-bold tracking-tight text-white">Live Activity Stream</h2>
          </div>
          <p className="text-xs text-slate-400">
            Real-time feed of AI agent detections, GitHub PR correlations, and commitment status
            transitions.
          </p>
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-950/80 border border-white/10 overflow-x-auto">
          {[
            { id: "all", label: "All Activity" },
            { id: "ai", label: "AI Autonomous" },
            { id: "deadline", label: "Deadlines" },
            { id: "commitment", label: "Commitments" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                filterType === tab.id
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Activity Timeline List */}
      <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 sm:p-8 backdrop-blur-2xl shadow-xl">
        <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:inset-0 before:left-3 sm:before:left-4 before:w-[2px] before:bg-gradient-to-b before:from-cyan-400/40 before:via-blue-500/20 before:to-transparent">
          {filtered.map((item) => (
            <div key={item.id} className="relative group">
              {/* Node indicator */}
              <div className="absolute -left-6 sm:-left-8 top-1 w-6 h-6 rounded-full bg-slate-950 border border-white/15 flex items-center justify-center shadow-lg group-hover:border-cyan-400 transition-colors">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
              </div>

              {/* Event Card */}
              <div className="rounded-2xl bg-slate-950/60 border border-white/5 p-4 sm:p-5 transition-all duration-200 hover:border-blue-500/30 hover:bg-slate-950/90 shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-slate-900 border border-white/10">
                      {getIcon(item.type)}
                    </div>
                    <span className="text-sm font-bold text-slate-100">{item.title}</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    {item.badge && (
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${getBadgeStyle(
                          item.type,
                        )}`}
                      >
                        {item.badge}
                      </span>
                    )}
                    <span className="text-[11px] font-mono text-slate-400">{item.timestamp}</span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pl-9">
                  {item.description}
                </p>

                {item.sourceMeeting && (
                  <div className="mt-3 pt-2 pl-9 border-t border-white/5 flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                    <span>Source:</span>
                    <span className="text-cyan-400 font-semibold">{item.sourceMeeting}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
