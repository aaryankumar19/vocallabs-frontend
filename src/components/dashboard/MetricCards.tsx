import React from "react";
import {
  CheckCircle2,
  Clock,
  Layers,
  TrendingUp,
  ShieldAlert,
} from "lucide-react";
import { ApiCommitment } from "@/lib/api";

interface MetricCardsProps {
  commitments: ApiCommitment[];
  onFilterSelect?: (filter: string) => void;
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  commitments,
  onFilterSelect,
}) => {
  const activeCount = commitments.filter((c) => {
    const s = (c.status || "").toLowerCase();
    return s.includes("progress") || s === "ongoing" || s === "pending";
  }).length;

  const completedCount = commitments.filter((c) => {
    const s = (c.status || "").toLowerCase();
    return s.includes("complete") || s === "done";
  }).length;

  const atRiskCount = commitments.filter((c) => {
    const s = (c.status || "").toLowerCase();
    return s.includes("risk") || s.includes("blocked") || s.includes("review");
  }).length;

  const total = commitments.length;
  const completionRate = total > 0 ? Math.round((completedCount / total) * 100) : 100;

  const cards = [
    {
      id: "active",
      title: "ACTIVE COMMITMENTS",
      value: activeCount,
      subtext: `${total} total tracked`,
      icon: Layers,
      color: "blue",
      glow: "rgba(59, 130, 246, 0.15)",
      borderColor: "border-blue-500/20 hover:border-blue-500/40",
      badgeBg: "bg-blue-500/15 text-blue-300 border-blue-500/30",
      trendIcon: TrendingUp,
    },
    {
      id: "completed",
      title: "COMPLETED",
      value: completedCount,
      subtext: `${completionRate}% completion rate`,
      icon: CheckCircle2,
      color: "emerald",
      glow: "rgba(34, 197, 94, 0.15)",
      borderColor: "border-emerald-500/20 hover:border-emerald-500/40",
      badgeBg: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
      trendIcon: TrendingUp,
    },
    {
      id: "pending",
      title: "PENDING / IN PROGRESS",
      value: activeCount,
      subtext: "Tracking verification",
      icon: Clock,
      color: "amber",
      glow: "rgba(245, 158, 11, 0.15)",
      borderColor: "border-amber-500/20 hover:border-amber-500/40",
      badgeBg: "bg-amber-500/15 text-amber-300 border-amber-500/30",
      trendIcon: null,
    },
    {
      id: "risk",
      title: "NEEDS ATTENTION",
      value: atRiskCount,
      subtext: atRiskCount > 0 ? "Requires review" : "All on track",
      icon: ShieldAlert,
      color: "rose",
      glow: "rgba(239, 68, 68, 0.15)",
      borderColor: "border-rose-500/20 hover:border-rose-500/40",
      badgeBg: "bg-rose-500/15 text-rose-300 border-rose-500/30",
      trendIcon: null,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const TrendIcon = card.trendIcon;

        return (
          <div
            key={card.id}
            onClick={() => onFilterSelect && onFilterSelect(card.id)}
            className={`group relative overflow-hidden rounded-2xl border ${card.borderColor} bg-slate-900/60 p-5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer`}
          >
            {/* Ambient card glow */}
            <div
              className="absolute -top-12 -right-12 w-28 h-28 rounded-full blur-2xl pointer-events-none opacity-40 group-hover:opacity-80 transition-opacity"
              style={{ backgroundColor: card.glow }}
            />

            <div className="relative z-10 flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {card.title}
              </span>
              <div
                className="p-2 rounded-xl bg-slate-950/80 border border-white/5 shadow-inner transition-transform group-hover:scale-110"
              >
                <Icon className="w-4 h-4 text-slate-200" />
              </div>
            </div>

            <div className="relative z-10 flex items-baseline justify-between">
              <div>
                <span className="text-3xl font-extrabold font-mono tracking-tight text-white">
                  {card.value}
                </span>
              </div>

              <div
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${card.badgeBg}`}
              >
                {TrendIcon && <TrendIcon className="w-3 h-3" />}
                <span>{card.subtext}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
