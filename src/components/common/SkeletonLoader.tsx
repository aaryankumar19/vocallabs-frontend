import React from "react";

interface SkeletonLoaderProps {
  type?: "card" | "table-row" | "metrics" | "chart";
  count?: number;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ type = "card", count = 1 }) => {
  const renderItem = (index: number) => {
    switch (type) {
      case "metrics":
        return (
          <div
            key={index}
            className="rounded-2xl border border-white/5 bg-slate-900/40 p-5 animate-pulse"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-9 h-9 rounded-xl bg-slate-800" />
              <div className="w-16 h-5 rounded-full bg-slate-800" />
            </div>
            <div className="w-12 h-7 rounded bg-slate-800 mb-2" />
            <div className="w-24 h-4 rounded bg-slate-800/60" />
          </div>
        );

      case "table-row":
        return (
          <div
            key={index}
            className="flex items-center justify-between p-4 border-b border-white/5 animate-pulse"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-800" />
              <div className="space-y-1.5">
                <div className="w-48 h-4 rounded bg-slate-800" />
                <div className="w-24 h-3 rounded bg-slate-800/60" />
              </div>
            </div>
            <div className="w-20 h-6 rounded-full bg-slate-800" />
            <div className="w-16 h-4 rounded bg-slate-800" />
            <div className="w-12 h-6 rounded-full bg-slate-800" />
          </div>
        );

      case "card":
      default:
        return (
          <div
            key={index}
            className="rounded-2xl border border-white/5 bg-slate-900/40 p-5 animate-pulse space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="w-32 h-5 rounded bg-slate-800" />
              <div className="w-12 h-4 rounded bg-slate-800/60" />
            </div>
            <div className="space-y-2">
              <div className="w-full h-3 rounded bg-slate-800/80" />
              <div className="w-3/4 h-3 rounded bg-slate-800/60" />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <div className="w-6 h-6 rounded-full bg-slate-800" />
              <div className="w-20 h-3 rounded bg-slate-800" />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="w-full space-y-3">
      {Array.from({ length: count }).map((_, i) => renderItem(i))}
    </div>
  );
};
