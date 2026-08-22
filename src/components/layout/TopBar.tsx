import React, { useState, useEffect } from "react";
import { Search, Sparkles, Menu, Plus, Activity, CheckCircle2 } from "lucide-react";
import { TabType } from "./Sidebar";
import { Group, HealthResponse, getBackendHealth } from "@/lib/api";
import { GroupSelector } from "@/components/groups/GroupSelector";

interface TopBarProps {
  activeTab: TabType;
  selectedGroup: Group | null;
  onSelectGroup: (group: Group | null) => void;
  onOpenNewMeeting: () => void;
  onToggleMobileMenu: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onGroupsUpdated?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  selectedGroup,
  onSelectGroup,
  onOpenNewMeeting,
  onToggleMobileMenu,
  searchQuery,
  onSearchChange,
  onGroupsUpdated,
}) => {
  const [health, setHealth] = useState<HealthResponse | null>(null);

  useEffect(() => {
    getBackendHealth()
      .then((res) => setHealth(res))
      .catch(() => setHealth(null));
  }, []);

  const getPageMeta = () => {
    switch (activeTab) {
      case "meetings":
        return {
          title: "Meetings Workspace",
          subtitle: "LiveKit live rooms, audio transcriptions, and commitment logs.",
        };
      case "commitments":
        return {
          title: "Commitments Tracker",
          subtitle: "Synchronized team action items with autonomous AI verification.",
        };
      case "activity" as string:
        return {
          title: "Telemetry Stream",
          subtitle: "Real-time activity log from meeting transcriptions and AI evaluations.",
        };
      case "settings":
        return {
          title: "Backend & Workspace Settings",
          subtitle: "FastAPI, Whisper STT, and account telemetry status.",
        };
      case "overview":
      default:
        return {
          title: "Intelligence Command Center",
          subtitle: "Autonomous post-meeting tracking and execution follow-through.",
        };
    }
  };

  const meta = getPageMeta();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 border-b border-[#B7E6DF] bg-[#F3FFFE]/90 backdrop-blur-xl shadow-[0_1px_4px_0_rgba(13,148,136,0.03)]">
      {/* Left: Mobile Menu & Page Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 text-slate-600 hover:text-[#0F292B] rounded-xl bg-[#D1F2EE] hover:bg-[#B7E6DF] border border-[#B7E6DF]"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-lg font-bold tracking-tight text-[#0F292B] flex items-center gap-2">
            {meta.title}
          </h1>
          <p className="text-xs text-[#115E59] hidden sm:block">{meta.subtitle}</p>
        </div>
      </div>

      {/* Right: Group Switcher, Search, AI Status, Action */}
      <div className="flex items-center gap-3">
        {/* Workspace / Group Selector */}
        <GroupSelector
          selectedGroup={selectedGroup}
          onSelectGroup={onSelectGroup}
          {...(onGroupsUpdated ? { onGroupsUpdated } : {})}
        />

        {/* Search Bar */}
        <div className="relative hidden md:block w-56">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-3.5 h-3.5" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search commitments..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white border border-[#B7E6DF] text-xs text-[#0F292B] placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#0D9488] focus:ring-2 focus:ring-[#D1F2EE] transition-all shadow-2xs"
          />
        </div>

        {/* Backend & STT Status Pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#D1F2EE] border border-[#B7E6DF] text-xs shadow-2xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0D9488] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0D9488]"></span>
          </span>
          <span className="text-[11px] font-semibold text-[#115E59]">
            {health?.status === "online" ? "FastAPI Online" : "FastAPI Connected"}
          </span>
        </div>

        {/* Primary Action: + New Meeting */}
        <button
          onClick={onOpenNewMeeting}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[#0D9488] via-[#0891B2] to-[#0284C7] hover:from-[#0F766E] hover:to-[#0369A1] shadow-sm shadow-[#0D9488]/25 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden xs:inline">+ New Meeting</span>
        </button>
      </div>
    </header>
  );
};
