import React from "react";
import { CheckCircle2, Clock, Layers, TrendingUp, ShieldAlert } from "lucide-react";
import { ApiCommitment } from "@/lib/api";

interface MetricCardsProps {
  commitments: ApiCommitment[];
  onFilterSelect?: (filter: string) => void;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ commitments, onFilterSelect }) => {
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
      iconColor: "text-[#0D9488]",
      iconBg: "bg-[#D1F2EE] border-[#B7E6DF]",
      cardBg: "bg-white/90 hover:bg-[#D1F2EE]/20",
      borderColor: "border-[#B7E6DF] hover:border-[#0D9488]",
      badgeBg: "bg-[#D1F2EE] text-[#0F766E] border-[#B7E6DF]",
      trendIcon: TrendingUp,
    },
    {
      id: "completed",
      title: "COMPLETED",
      value: completedCount,
      subtext: `${completionRate}% rate`,
      icon: CheckCircle2,
      iconColor: "text-[#0F766E]",
      iconBg: "bg-[#B7E6DF]/50 border-[#B7E6DF]",
      cardBg: "bg-white/90 hover:bg-[#B7E6DF]/20",
      borderColor: "border-[#B7E6DF] hover:border-[#0F766E]",
      badgeBg: "bg-[#B7E6DF] text-[#115E59] border-[#B7E6DF]",
      trendIcon: TrendingUp,
    },
    {
      id: "pending",
      title: "PENDING / IN PROGRESS",
      value: activeCount,
      subtext: "Tracking verification",
      icon: Clock,
      iconColor: "text-[#0284C7]",
      iconBg: "bg-[#E6F2FF] border-[#B7E6DF]",
      cardBg: "bg-white/90 hover:bg-[#E6F2FF]/30",
      borderColor: "border-[#B7E6DF] hover:border-[#0284C7]",
      badgeBg: "bg-[#E6F2FF] text-[#0369A1] border-[#B7E6DF]",
      trendIcon: null,
    },
    {
      id: "risk",
      title: "NEEDS ATTENTION",
      value: atRiskCount,
      subtext: atRiskCount > 0 ? "Requires review" : "All on track",
      icon: ShieldAlert,
      iconColor: "text-[#BE185D]",
      iconBg: "bg-[#F9EAF0] border-[#B7E6DF]",
      cardBg: "bg-white/90 hover:bg-[#F9EAF0]/30",
      borderColor: "border-[#B7E6DF] hover:border-[#BE185D]",
      badgeBg: "bg-[#F9EAF0] text-[#9D174D] border-[#B7E6DF]",
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
            className={`group relative overflow-hidden rounded-2xl border ${card.borderColor} ${card.cardBg} p-5 shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md cursor-pointer`}
          >
            <div className="relative z-10 flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#115E59]">
                {card.title}
              </span>
              <div
                className={`p-2 rounded-xl ${card.iconBg} border shadow-2xs transition-transform group-hover:scale-105`}
              >
                <Icon className={`w-4 h-4 ${card.iconColor}`} />
              </div>
            </div>

            <div className="relative z-10 flex items-baseline justify-between">
              <div>
                <span className="text-3xl font-extrabold font-mono tracking-tight text-[#0F292B]">
                  {card.value}
                </span>
              </div>

              <div
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${card.badgeBg}`}
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
