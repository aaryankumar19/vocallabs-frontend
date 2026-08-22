import React, { useState, useEffect } from "react";
import {
  Video,
  Plus,
  Clock,
  Calendar,
  CheckSquare,
  Sparkles,
  StopCircle,
  Radio,
  Loader2,
  ChevronRight,
  Headphones,
} from "lucide-react";
import {
  MeetingItem,
  Group,
  endGroupMeeting,
  getLiveKitToken,
  ApiCommitment,
} from "@/lib/api";
import { getAuthUser } from "@/lib/auth";
import { MeetingDetailModal } from "./MeetingDetailModal";
import { toast } from "sonner";

interface MeetingsListProps {
  selectedGroup: Group | null;
  ongoingMeetings?: MeetingItem[];
  pastMeetings?: MeetingItem[];
  isLoading?: boolean;
  onRefreshMeetings?: () => void;
  onOpenNewMeeting: () => void;
  onSelectCommitment: (comm: ApiCommitment) => void;
  onEnterLiveRoom?: (room: {
    meetingId: string;
    roomName: string;
    token?: string;
    livekitUrl?: string;
    title: string;
  }) => void;
}

export const MeetingsList: React.FC<MeetingsListProps> = ({
  selectedGroup,
  ongoingMeetings = [],
  pastMeetings = [],
  isLoading = false,
  onRefreshMeetings,
  onOpenNewMeeting,
  onSelectCommitment,
  onEnterLiveRoom,
}) => {
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingItem | null>(null);
  const [endingId, setEndingId] = useState<string | null>(null);

  useEffect(() => {
    if (onRefreshMeetings) {
      onRefreshMeetings();
    }
  }, [selectedGroup?.id]);

  const handleEndMeeting = async (e: React.MouseEvent, meetingId: string) => {
    e.stopPropagation();
    if (!selectedGroup) return;

    try {
      setEndingId(meetingId);
      await endGroupMeeting(selectedGroup.id, meetingId);
      toast.success("Meeting ended and queued for transcription analysis!");
      if (onRefreshMeetings) onRefreshMeetings();
    } catch (err: any) {
      toast.error(err.message || "Failed to end meeting");
    } finally {
      setEndingId(null);
    }
  };

  const handleJoinLive = async (e: React.MouseEvent, m: MeetingItem) => {
    e.stopPropagation();
    if (!onEnterLiveRoom) return;

    const roomName = m.external_id || `room-${m.id.slice(0, 8)}`;

    try {
      const user = getAuthUser();
      const identity = user?.email || user?.id || `user-${Date.now().toString(36)}`;
      const displayName = user?.name || user?.email?.split("@")[0] || "Participant";

      const tokenRes = await getLiveKitToken(roomName, identity, displayName, selectedGroup?.id);

      onEnterLiveRoom({
        meetingId: m.id,
        roomName: m.external_id || roomName,
        token: tokenRes.token,
        livekitUrl: tokenRes.livekit_url,
        title: m.title,
      });
    } catch (err: any) {
      console.warn("LiveKit token fetch failed, proceeding with direct room:", err);
      onEnterLiveRoom({
        meetingId: m.id,
        roomName: m.external_id || roomName,
        title: m.title,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Meetings Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl border border-[#B7E6DF] bg-white/90 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#0D9488]" />
            <h2 className="text-xl font-bold tracking-tight text-[#0F292B]">
              {selectedGroup ? `${selectedGroup.name} Meetings` : "Meetings Workspace"}
            </h2>
          </div>
          <p className="text-xs text-[#115E59]">
            Real-time LiveKit audio rooms, speech-to-text transcriptions, and commitment extraction.
          </p>
        </div>

        <button
          onClick={onOpenNewMeeting}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[#0D9488] via-[#0891B2] to-[#0284C7] hover:from-[#0F766E] hover:to-[#0369A1] shadow-sm shadow-[#0D9488]/20 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Meeting</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-3">
          <Loader2 className="w-7 h-7 animate-spin text-[#0D9488]" />
          <span className="text-xs font-medium text-[#115E59]">Loading group meetings...</span>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Ongoing Live Meetings Section */}
          {ongoingMeetings.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#9D174D]">
                <span className="w-2 h-2 rounded-full bg-[#BE185D] animate-ping" />
                <span>Live Ongoing Meetings ({ongoingMeetings.length})</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ongoingMeetings.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => setSelectedMeeting(m)}
                    className="relative overflow-hidden rounded-3xl border border-[#B7E6DF] bg-[#F9EAF0]/60 p-6 transition-all duration-300 hover:border-[#BE185D] hover:shadow-md cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs mb-3">
                        <div className="flex items-center gap-2 text-[#9D174D] font-semibold">
                          <Radio className="w-4 h-4 animate-pulse text-[#BE185D]" />
                          <span>Live Session Active</span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-500">
                          {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-[#0F292B] mb-2">{m.title}</h3>
                      <p className="text-xs text-[#115E59] mb-4">
                        Source: {m.source} • Meeting ID: {m.id.slice(0, 8)}...
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-[#B7E6DF]/60 text-xs gap-2">
                      <button
                        onClick={(e) => handleJoinLive(e, m)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white font-semibold text-xs shadow-xs transition-all cursor-pointer"
                      >
                        <Headphones className="w-3.5 h-3.5" />
                        Join Audio Room
                      </button>

                      <button
                        onClick={(e) => handleEndMeeting(e, m.id)}
                        disabled={endingId === m.id}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-xs transition-all cursor-pointer"
                      >
                        {endingId === m.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <StopCircle className="w-3.5 h-3.5" />
                        )}
                        End Meeting
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Past Meetings Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#115E59]">
              <Clock className="w-4 h-4" />
              <span>Past Meetings &amp; Commitments ({pastMeetings.length})</span>
            </div>

            {pastMeetings.length === 0 && ongoingMeetings.length === 0 ? (
              <div className="p-12 text-center rounded-3xl border border-dashed border-[#B7E6DF] bg-white">
                <Video className="w-10 h-10 text-[#0D9488]/60 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-[#0F292B]">No meetings recorded yet</h4>
                <p className="text-xs text-[#115E59] mt-1 max-w-sm mx-auto">
                  Upload an audio recording or start a live room to automatically extract commitments.
                </p>
                <button
                  onClick={onOpenNewMeeting}
                  className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#0D9488] hover:bg-[#0F766E] cursor-pointer inline-flex items-center gap-2 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Process First Meeting
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pastMeetings.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => setSelectedMeeting(m)}
                    className="group relative overflow-hidden rounded-3xl border border-[#B7E6DF] bg-white p-6 transition-all duration-300 hover:border-[#0D9488] hover:-translate-y-0.5 hover:shadow-md cursor-pointer flex flex-col justify-between shadow-xs"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 rounded-lg bg-[#D1F2EE] text-[#0D9488] border border-[#B7E6DF]">
                            <Video className="w-3.5 h-3.5" />
                          </span>
                          <span className="font-semibold text-[#0F292B]">
                            {new Date(m.created_at).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#E6F2FF] text-[#0369A1] border border-[#B7E6DF]/60">
                          {m.status}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-[#0F292B] group-hover:text-[#0D9488] transition-colors mb-2">
                        {m.title}
                      </h3>
                      <p className="text-xs text-[#115E59] mb-4">
                        Source: {m.source} • ID: {m.id.slice(0, 8)}...
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-[#D1F2EE] text-xs text-slate-500">
                      <span className="flex items-center gap-1.5 text-[#0D9488] font-semibold">
                        <CheckSquare className="w-3.5 h-3.5" />
                        View Commitments &amp; AI Analysis
                      </span>
                      <ChevronRight className="w-4 h-4 text-[#0D9488] group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Meeting Detail Modal for Commitments */}
      <MeetingDetailModal
        meeting={selectedMeeting}
        onClose={() => setSelectedMeeting(null)}
        onSelectCommitment={onSelectCommitment}
      />
    </div>
  );
};
