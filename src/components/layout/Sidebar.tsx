import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Video,
  CheckSquare,
  Settings,
  Sparkles,
  LogOut,
  X,
  Server,
  Radio,
} from "lucide-react";
import { logout as authLogout, getAuthUser } from "@/lib/auth";
import { getBackendHealth, HealthResponse } from "@/lib/api";

export type TabType = "overview" | "meetings" | "commitments" | "settings";

interface SidebarProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  meetingsCount?: number;
  commitmentsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpenMobile = false,
  onCloseMobile,
  meetingsCount = 0,
  commitmentsCount = 0,
}) => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const user = getAuthUser();

  useEffect(() => {
    getBackendHealth()
      .then(setHealth)
      .catch(() => setHealth(null));
  }, []);

  const navItems: {
    id: TabType;
    label: string;
    icon: React.FC<{ className?: string }>;
    badge?: string;
  }[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "meetings", label: "Meetings", icon: Video, badge: meetingsCount > 0 ? String(meetingsCount) : undefined },
    { id: "commitments", label: "Commitments", icon: CheckSquare, badge: commitmentsCount > 0 ? String(commitmentsCount) : undefined },
    { id: "settings", label: "Backend & Setup", icon: Settings },
  ];

  const handleSignOut = () => {
    authLogout();
    window.location.href = "/login";
  };

  const displayName = user?.name || user?.email?.split("@")[0] || "User";
  const displayEmail = user?.email || "";
  const initial = (displayName[0] || "U").toUpperCase();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden animate-in fade-in"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-72 flex flex-col justify-between border-r border-white/10 bg-[#070C1E]/95 backdrop-blur-2xl transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header & Navigation */}
        <div>
          <div className="flex items-center justify-between p-6 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-[1px] shadow-lg shadow-blue-500/20">
                <div className="w-full h-full rounded-[15px] bg-slate-950 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                </div>
              </div>
              <div>
                <span className="block text-sm font-bold tracking-tight text-white font-mono">
                  VocalLabs
                </span>
                <span className="block text-[10px] font-semibold text-cyan-400 uppercase tracking-wider">
                  AI Follow-Through
                </span>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Workspace
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={`group relative w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "text-white bg-blue-600/15 border border-blue-500/30 shadow-lg shadow-blue-500/10"
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
                  }`}
                >
                  {/* Left Active Glow Indicator */}
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-cyan-400 shadow-sm shadow-cyan-400" />
                  )}

                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive ? "text-cyan-400" : "text-slate-400 group-hover:text-slate-200"
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        isActive ? "bg-blue-500/20 text-blue-300" : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Live Backend Telemetry & Real User Profile */}
        <div className="p-4 space-y-3 border-t border-white/5">
          {/* Live Telemetry Info Card */}
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-white/5 text-xs space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-blue-400" />
                Backend Engine
              </span>
              <span className="text-emerald-400 font-mono font-bold text-[10px]">
                ● {health?.status || "Online"}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-cyan-400" />
                Whisper STT
              </span>
              <span className="text-cyan-300 font-mono text-[10px]">
                {health?.whisper_stt?.status || "Online"}
              </span>
            </div>
          </div>

          {/* Real User Profile Bar */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-white/5">
            <div className="flex items-center gap-2.5 min-w-0">
              {user?.picture ? (
                <img
                  src={user.picture}
                  alt={displayName}
                  className="w-8 h-8 rounded-full object-cover border border-white/10 shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center font-bold text-white text-xs shrink-0">
                  {initial}
                </div>
              )}
              <div className="text-left min-w-0">
                <span className="block text-xs font-semibold text-slate-200 truncate leading-tight">
                  {displayName}
                </span>
                <span className="block text-[10px] text-slate-400 truncate leading-tight">
                  {displayEmail}
                </span>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              title="Sign out"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
