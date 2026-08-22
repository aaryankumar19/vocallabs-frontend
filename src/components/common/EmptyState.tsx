import React from "react";
import { Sparkles, Calendar, CheckCircle2, AlertCircle, Plus } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  iconType?: "meeting" | "check" | "alert" | "ai";
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionText,
  onAction,
  iconType = "ai",
}) => {
  const getIcon = () => {
    switch (iconType) {
      case "meeting":
        return <Calendar className="w-8 h-8 text-blue-600" />;
      case "check":
        return <CheckCircle2 className="w-8 h-8 text-emerald-600" />;
      case "alert":
        return <AlertCircle className="w-8 h-8 text-amber-600" />;
      default:
        return <Sparkles className="w-8 h-8 text-indigo-600" />;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-10 text-center rounded-3xl border border-slate-200 bg-white shadow-2xs">
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-4">
        {getIcon()}
      </div>
      <h3 className="text-base font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-6">{description}</p>
      {actionText && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 shadow-xs transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          {actionText}
        </button>
      )}
    </div>
  );
};
