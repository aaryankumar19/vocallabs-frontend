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
    { id: "meetings", label: "Meetings", icon: Video, ...(meetingsCount > 0 ? { badge: String(meetingsCount) } : {}) },
    { id: "commitments", label: "Commitments", icon: CheckSquare, ...(commitmentsCount > 0 ? { badge: String(commitmentsCount) } : {}) },
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
          className="fixed inset-0 z-40 bg-[#0F292B]/40 backdrop-blur-sm lg:hidden animate-in fade-in"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-72 flex flex-col justify-between border-r border-[#B7E6DF] bg-[#F3FFFE]/95 backdrop-blur-2xl transition-transform duration-300 ease-in-out lg:translate-x-0 shadow-[4px_0_24px_-4px_rgba(13,148,136,0.06)] ${
          isOpenMobile ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header & Navigation */}
        <div>
          <div className="flex items-center justify-between p-6 border-b border-[#D1F2EE]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#0D9488] via-[#0891B2] to-[#0284C7] p-[1.5px] shadow-md shadow-[#0D9488]/25">
                <div className="w-full h-full rounded-[14px] bg-[#F3FFFE] flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-[#0D9488]" />
                </div>
              </div>
              <div>
                <span className="block text-sm font-bold tracking-tight text-[#0F292B] font-mono">
                  VocalLabs
                </span>
                <span className="block text-[10px] font-semibold text-[#0D9488] uppercase tracking-wider">
                  AI Follow-Through
                </span>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 text-slate-400 hover:text-[#0F292B] rounded-lg hover:bg-[#D1F2EE]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-[#115E59]/70">
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
                      ? "text-[#0F292B] bg-[#D1F2EE] border border-[#B7E6DF] shadow-xs font-bold"
                      : "text-slate-600 hover:text-[#0F292B] hover:bg-[#E6F2FF]/60 border border-transparent"
                  }`}
                >
                  {/* Left Active Coastal Indicator */}
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-1.5 rounded-r-full bg-[#0D9488]" />
                  )}

                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive ? "text-[#0D9488]" : "text-slate-400 group-hover:text-[#0D9488]"
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        isActive ? "bg-[#B7E6DF] text-[#115E59]" : "bg-[#E6F2FF] text-[#0369A1]"
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

        {/* Bottom Section: Live Backend Telemetry & User Profile */}
        <div className="p-4 space-y-3 border-t border-[#D1F2EE]">
          {/* Live Telemetry Info Card */}
          <div className="p-3 rounded-2xl bg-white border border-[#B7E6DF] text-xs space-y-1.5 shadow-2xs">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#0F292B] flex items-center gap-1.5 font-medium">
                <Server className="w-3.5 h-3.5 text-[#0D9488]" />
                Backend Engine
              </span>
              <span className="text-[#0D9488] bg-[#D1F2EE] border border-[#B7E6DF] px-1.5 py-0.2 rounded font-mono font-bold text-[10px] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488]" />
                {health?.status || "Online"}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-600 flex items-center gap-1.5 font-medium">
                <Radio className="w-3.5 h-3.5 text-[#0284C7]" />
                Whisper STT
              </span>
              <span className="text-[#0369A1] font-mono text-[10px] font-medium bg-[#E6F2FF] px-1.5 py-0.2 rounded">
                {health?.whisper_stt?.status || "Online"}
              </span>
            </div>
          </div>

          {/* Real User Profile Bar */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#B7E6DF] shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              {user?.picture ? (
                <img
                  src={user.picture}
                  alt={displayName}
                  className="w-8 h-8 rounded-full object-cover border border-[#B7E6DF] shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#0D9488] to-[#0284C7] flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-2xs">
                  {initial}
                </div>
              )}
              <div className="text-left min-w-0">
                <span className="block text-xs font-semibold text-[#0F292B] truncate leading-tight">
                  {displayName}
                </span>
                <span className="block text-[10px] text-slate-500 truncate leading-tight">
                  {displayEmail}
                </span>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              title="Sign out"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-[#F9EAF0] rounded-lg transition-colors cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
