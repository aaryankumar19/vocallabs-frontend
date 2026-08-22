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
  const [groupMeetings, setGroupMeetings] = useState<{
    ongoing: MeetingItem[];
    past: MeetingItem[];
  }>({
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

      const firstGroup = groupsData[0] ?? null;
      if (firstGroup) {
        setSelectedGroup(firstGroup);
        await loadMeetings(firstGroup.id);
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
    <div className="min-h-screen bg-[#F3FFFE] text-[#0F292B] flex overflow-x-hidden selection:bg-[#D1F2EE] selection:text-[#0D9488]">
      {/* Breezy Coastal Ambient Atmosphere */}
      <div className="fixed top-0 left-1/4 w-[650px] h-[650px] bg-gradient-to-br from-[#D1F2EE]/80 via-[#B7E6DF]/30 to-transparent rounded-full blur-[130px] pointer-events-none z-0" />
      <div className="fixed bottom-0 right-1/4 w-[550px] h-[550px] bg-gradient-to-tl from-[#E6F2FF]/90 via-[#D1F2EE]/40 to-transparent rounded-full blur-[130px] pointer-events-none z-0" />
      <div className="fixed top-1/3 right-10 w-[450px] h-[450px] bg-gradient-to-bl from-[#F9EAF0]/70 via-[#E6F2FF]/30 to-transparent rounded-full blur-[130px] pointer-events-none z-0" />

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
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        {/* Top Floating Nav */}
        <TopBar
          activeTab={activeTab}
          selectedGroup={selectedGroup}
          onSelectGroup={handleGroupSelected}
          onOpenNewMeeting={() => setIsNewMeetingModalOpen(true)}
          onToggleMobileMenu={() => setIsMobileSidebarOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          {...(loadInitialData ? { onGroupsUpdated: loadInitialData } : {})}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Active Live Audio-only Room Overlay */}
          {activeLiveRoom ? (
            <LiveAudioRoom
              meetingId={activeLiveRoom.meetingId}
              roomName={activeLiveRoom.roomName}
              groupId={selectedGroup?.id ?? null}
              {...(activeLiveRoom.livekitUrl ? { livekitUrl: activeLiveRoom.livekitUrl } : {})}
              {...(activeLiveRoom.token ? { token: activeLiveRoom.token } : {})}
              {...(activeLiveRoom.title ? { title: activeLiveRoom.title } : {})}
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
                    groupName={selectedGroup?.name ?? ""}
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
                  <div className="p-6 sm:p-8 rounded-3xl border border-[#B7E6DF] bg-white/90 backdrop-blur-xl shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#0D9488] animate-pulse" />
                      <h2 className="text-xl font-bold tracking-tight text-[#0F292B]">
                        Backend Architecture &amp; Workspace Telemetry
                      </h2>
                    </div>
                    <p className="text-xs text-[#115E59]">
                      Live connection configuration to the VocalLabs FastAPI server and LiveKit
                      WebRTC subsystems.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* FastAPI Backend */}
                    <div className="p-6 rounded-3xl border border-[#B7E6DF] bg-white/90 backdrop-blur-xl space-y-3 shadow-sm hover:border-[#0D9488] transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-[#D1F2EE] border border-[#B7E6DF] flex items-center justify-center text-[#0D9488]">
                          <Server className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-[#0F292B]">FastAPI Core Server</h4>
                          <p className="text-xs text-slate-500 font-mono break-all">
                            {BACKEND_URL}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-[#D1F2EE] text-xs text-slate-500">
                        <span>Status</span>
                        <span className="text-[#0D9488] font-bold font-mono flex items-center gap-1.5 bg-[#D1F2EE]/70 px-2 py-0.5 rounded-full">
                          <span className="w-2 h-2 rounded-full bg-[#0D9488]" />
                          {health?.status || "Online"}
                        </span>
                      </div>
                    </div>

                    {/* LiveKit Cloud WebRTC */}
                    <div className="p-6 rounded-3xl border border-[#B7E6DF] bg-white/90 backdrop-blur-xl space-y-3 shadow-sm hover:border-[#0891B2] transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-[#E6F2FF] border border-[#B7E6DF] flex items-center justify-center text-[#0284C7]">
                          <Cloud className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-[#0F292B]">LiveKit Cloud WebRTC</h4>
                          <p className="text-xs text-slate-500 font-mono text-[11px] truncate">
                            wss://vocallabsai-qun1rvmf.livekit.cloud
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-[#D1F2EE] text-xs text-slate-500">
                        <span>Audio Stream Mode</span>
                        <span className="text-[#0369A1] font-medium font-mono text-[11px] bg-[#E6F2FF] px-2 py-0.5 rounded-full border border-[#B7E6DF]/60">
                          Audio Only • 2s Silence STT
                        </span>
                      </div>
                    </div>

                    {/* Whisper Speech-to-Text */}
                    <div className="p-6 rounded-3xl border border-[#B7E6DF] bg-white/90 backdrop-blur-xl space-y-3 shadow-sm hover:border-[#0D9488] transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-[#D1F2EE] border border-[#B7E6DF] flex items-center justify-center text-[#0D9488]">
                          <Radio className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-[#0F292B]">
                            Whisper Speech-to-Text
                          </h4>
                          <p className="text-xs text-slate-500 font-mono">
                            {health?.whisper_stt?.url || "Remote Whisper STT API"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-[#D1F2EE] text-xs text-slate-500">
                        <span>Provider</span>
                        <span className="text-[#0F766E] font-mono font-medium">
                          {health?.whisper_stt?.provider || "remote_whisper_api"}
                        </span>
                      </div>
                    </div>

                    {/* Database Telemetry */}
                    <div className="p-6 rounded-3xl border border-[#B7E6DF] bg-white/90 backdrop-blur-xl space-y-3 shadow-sm hover:border-[#0D9488] transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-[#E6F2FF] border border-[#B7E6DF] flex items-center justify-center text-[#0D9488]">
                          <Database className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-[#0F292B]">
                            Database &amp; R2 Storage
                          </h4>
                          <p className="text-xs text-slate-500">
                            PostgreSQL transcripts &amp; Cloudflare R2 audio blobs
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-[#D1F2EE] text-xs text-slate-500">
                        <span>Health</span>
                        <span className="text-[#0D9488] font-bold font-mono flex items-center gap-1.5 bg-[#D1F2EE]/70 px-2 py-0.5 rounded-full">
                          <span className="w-2 h-2 rounded-full bg-[#0D9488]" />
                          {health?.database || "Healthy"}
                        </span>
                      </div>
                    </div>

                    {/* Active User Account */}
                    <div className="p-6 rounded-3xl border border-[#B7E6DF] bg-white/90 backdrop-blur-xl space-y-3 md:col-span-2 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-[#F9EAF0] border border-[#B7E6DF] flex items-center justify-center text-[#9D174D]">
                          <Key className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-[#0F292B]">Active User Identity</h4>
                          <p className="text-xs text-slate-500">
                            {currentUser?.email || "Authenticated"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-[#D1F2EE] text-xs text-slate-500">
                        <span>Auth Token</span>
                        <span className="text-[#115E59] font-mono text-[10px] bg-[#D1F2EE] px-2 py-0.5 rounded-md border border-[#B7E6DF]/60">
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
