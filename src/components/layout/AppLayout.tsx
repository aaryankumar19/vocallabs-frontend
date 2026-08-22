import React, { useState, useEffect } from "react";
import { Sidebar, TabType } from "./Sidebar";
import { TopBar } from "./TopBar";
import { HeroSection } from "@/components/dashboard/HeroSection";
import { MetricCards } from "@/components/dashboard/MetricCards";
import { FollowThroughPipeline } from "@/components/dashboard/FollowThroughPipeline";
import { CommitmentsTable } from "@/components/dashboard/CommitmentsTable";
import { CommitmentDrawer } from "@/components/dashboard/CommitmentDrawer";
import { NewMeetingModal } from "@/components/common/NewMeetingModal";
import { MeetingsList } from "@/components/meetings/MeetingsList";
import { CommitmentsWorkspace } from "@/components/commitments/CommitmentsWorkspace";
import { LiveAudioRoom } from "@/components/meetings/LiveAudioRoom";
import {
  Group,
  ApiCommitment,
  MeetingItem,
  getMyGroups,
  getCommitments,
  getGroupMeetings,
  getBackendHealth,
  HealthResponse,
  BACKEND_URL,
} from "@/lib/api";
import { getAuthUser, getAuthToken } from "@/lib/auth";
import { Server, Radio, Database, Key, Cloud } from "lucide-react";

export const AppLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isNewMeetingModalOpen, setIsNewMeetingModalOpen] = useState(false);
  const [selectedCommitment, setSelectedCommitment] = useState<ApiCommitment | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [commitments, setCommitments] = useState<ApiCommitment[]>([]);
  const [groupMeetings, setGroupMeetings] = useState<{ ongoing: MeetingItem[]; past: MeetingItem[] }>({
    ongoing: [],
    past: [],
  });
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Active Live Audio-only Room Session
  const [activeLiveRoom, setActiveLiveRoom] = useState<{
    meetingId: string;
    roomName: string;
    token?: string;
    livekitUrl?: string;
    title?: string;
  } | null>(null);

  const currentUser = getAuthUser();
  const authToken = getAuthToken();

  const loadCommitments = async () => {
    try {
      const data = await getCommitments();
      setCommitments(data || []);
    } catch (err) {
      console.error("Failed to load commitments:", err);
    }
  };

  const loadMeetings = async (groupId?: string) => {
    const targetGroupId = groupId || selectedGroup?.id;
    if (!targetGroupId) return;
    try {
      const res = await getGroupMeetings(targetGroupId);
      setGroupMeetings({
        ongoing: res.ongoing_meetings || [],
        past: res.past_meetings || [],
      });
    } catch (err) {
      console.error("Failed to load group meetings:", err);
    }
  };

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const [groupsData, commsData, healthData] = await Promise.all([
        getMyGroups().catch(() => []),
        getCommitments().catch(() => []),
        getBackendHealth().catch(() => null),
      ]);

      setCommitments(commsData || []);
      setHealth(healthData);

      if (groupsData.length > 0) {
        setSelectedGroup(groupsData[0]);
        await loadMeetings(groupsData[0].id);
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      loadMeetings(selectedGroup.id);
    }
  }, [selectedGroup?.id]);

  const handleGroupSelected = (group: Group | null) => {
    setSelectedGroup(group);
    if (group) {
      loadMeetings(group.id);
    }
  };

  const handleMeetingProcessed = () => {
    loadCommitments();
    if (selectedGroup) {
      loadMeetings(selectedGroup.id);
    }
  };

  const handleEnterLiveRoom = (room: {
    meetingId: string;
    roomName: string;
    token?: string;
    livekitUrl?: string;
    title?: string;
  }) => {
    setActiveLiveRoom(room);
  };

  const filteredCommitments = commitments.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (c.title || "").toLowerCase().includes(q) ||
      (c.owner || c.assignee || "").toLowerCase().includes(q) ||
      (c.meeting?.title || "").toLowerCase().includes(q)
    );
  });

  const totalMeetingsCount = groupMeetings.ongoing.length + groupMeetings.past.length;

  return (
    <div className="min-h-screen bg-[#050816] text-[#F8FAFC] flex overflow-x-hidden selection:bg-cyan-500/30 selection:text-white">
      {/* Dark Atmospheric Ambient Glows */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="fixed top-1/3 right-10 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[140px] pointer-events-none z-0" />

      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        meetingsCount={totalMeetingsCount}
        commitmentsCount={commitments.length}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72 z-10">
        {/* Top Floating Nav */}
        <TopBar
          activeTab={activeTab}
          selectedGroup={selectedGroup}
          onSelectGroup={handleGroupSelected}
          onOpenNewMeeting={() => setIsNewMeetingModalOpen(true)}
          onToggleMobileMenu={() => setIsMobileSidebarOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onGroupsUpdated={loadInitialData}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Active Live Audio-only Room Overlay */}
          {activeLiveRoom ? (
            <LiveAudioRoom
              meetingId={activeLiveRoom.meetingId}
              roomName={activeLiveRoom.roomName}
              groupId={selectedGroup?.id}
              livekitUrl={activeLiveRoom.livekitUrl}
              token={activeLiveRoom.token}
              title={activeLiveRoom.title}
              onLeave={() => {
                setActiveLiveRoom(null);
                loadInitialData();
              }}
            />
          ) : (
            <>
              {activeTab === "overview" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Hero Section */}
                  <HeroSection
                    onOpenNewMeeting={() => setIsNewMeetingModalOpen(true)}
                    onViewCommitments={() => setActiveTab("commitments")}
                    groupName={selectedGroup?.name}
                    totalCommitments={commitments.length}
                  />

                  {/* Live Metric Cards */}
                  <MetricCards
                    commitments={commitments}
                    onFilterSelect={() => setActiveTab("commitments")}
                  />

                  {/* Commitment Follow-Through Trace */}
                  {commitments.length > 0 && (
                    <FollowThroughPipeline
                      commitments={commitments}
                      onSelectCommitment={setSelectedCommitment}
                    />
                  )}

                  {/* Commitments Table */}
                  <CommitmentsTable
                    commitments={filteredCommitments}
                    onSelectCommitment={setSelectedCommitment}
                    onViewAll={() => setActiveTab("commitments")}
                  />
                </div>
              )}

              {activeTab === "meetings" && (
                <div className="animate-in fade-in duration-200">
                  <MeetingsList
                    selectedGroup={selectedGroup}
                    onOpenNewMeeting={() => setIsNewMeetingModalOpen(true)}
                    onSelectCommitment={setSelectedCommitment}
                    onEnterLiveRoom={handleEnterLiveRoom}
                  />
                </div>
              )}

              {activeTab === "commitments" && (
                <div className="animate-in fade-in duration-200">
                  <CommitmentsWorkspace
                    commitments={commitments}
                    onSelectCommitment={setSelectedCommitment}
                  />
                </div>
              )}

              {activeTab === "settings" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="p-6 sm:p-8 rounded-3xl border border-white/10 bg-slate-900/70 backdrop-blur-2xl">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2 h-2 rounded-full bg-cyan-400" />
                      <h2 className="text-xl font-bold tracking-tight text-white">
                        Backend Architecture &amp; Workspace Telemetry
                      </h2>
                    </div>
                    <p className="text-xs text-slate-400">
                      Live connection configuration to the VocalLabs FastAPI server and LiveKit WebRTC subsystems.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* FastAPI Backend */}
                    <div className="p-6 rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-xl space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-cyan-400">
                          <Server className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">FastAPI Core Server</h4>
                          <p className="text-xs text-slate-400 font-mono break-all">{BACKEND_URL}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs text-slate-400">
                        <span>Status</span>
                        <span className="text-emerald-400 font-bold font-mono">
                          ● {health?.status || "Online"}
                        </span>
                      </div>
                    </div>

                    {/* LiveKit Cloud WebRTC */}
                    <div className="p-6 rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-xl space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                          <Cloud className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">LiveKit Cloud WebRTC</h4>
                          <p className="text-xs text-slate-400 font-mono text-[11px] truncate">
                            wss://vocallabsai-qun1rvmf.livekit.cloud
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs text-slate-400">
                        <span>Audio Stream Mode</span>
                        <span className="text-cyan-300 font-mono text-[11px]">
                          Audio Only • 2s Silence STT
                        </span>
                      </div>
                    </div>

                    {/* Whisper Speech-to-Text */}
                    <div className="p-6 rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-xl space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                          <Radio className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">Whisper Speech-to-Text</h4>
                          <p className="text-xs text-slate-400 font-mono">
                            {health?.whisper_stt?.url || "Remote Whisper STT API"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs text-slate-400">
                        <span>Provider</span>
                        <span className="text-indigo-300 font-mono">
                          {health?.whisper_stt?.provider || "remote_whisper_api"}
                        </span>
                      </div>
                    </div>

                    {/* Database Telemetry */}
                    <div className="p-6 rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-xl space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                          <Database className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">Database &amp; R2 Storage</h4>
                          <p className="text-xs text-slate-400">PostgreSQL transcripts &amp; Cloudflare R2 audio blobs</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs text-slate-400">
                        <span>Health</span>
                        <span className="text-emerald-400 font-bold font-mono">
                          ● {health?.database || "Healthy"}
                        </span>
                      </div>
                    </div>

                    {/* Active User Account */}
                    <div className="p-6 rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-xl space-y-3 md:col-span-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400">
                          <Key className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">Active User Identity</h4>
                          <p className="text-xs text-slate-400">{currentUser?.email || "Authenticated"}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs text-slate-400">
                        <span>Auth Token</span>
                        <span className="text-slate-300 font-mono text-[10px]">
                          {authToken ? `${authToken.slice(0, 16)}...` : "Active"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Commitment Detail Slide-out Drawer */}
      <CommitmentDrawer
        commitment={selectedCommitment}
        onClose={() => setSelectedCommitment(null)}
        onCommitmentUpdated={loadCommitments}
      />

      {/* New Meeting Modal */}
      <NewMeetingModal
        isOpen={isNewMeetingModalOpen}
        onClose={() => setIsNewMeetingModalOpen(false)}
        selectedGroup={selectedGroup}
        onMeetingProcessed={handleMeetingProcessed}
        onEnterLiveRoom={handleEnterLiveRoom}
      />
    </div>
  );
};
