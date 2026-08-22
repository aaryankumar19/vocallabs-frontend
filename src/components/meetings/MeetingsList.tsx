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
  FileText,
  Loader2,
  ChevronRight,
  Headphones,
} from "lucide-react";
import {
  MeetingItem,
  Group,
  getGroupMeetings,
  endGroupMeeting,
  ApiCommitment,
} from "@/lib/api";
import { MeetingDetailModal } from "./MeetingDetailModal";
import { toast } from "sonner";

interface MeetingsListProps {
  selectedGroup: Group | null;
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
  onOpenNewMeeting,
  onSelectCommitment,
  onEnterLiveRoom,
}) => {
  const [ongoingMeetings, setOngoingMeetings] = useState<MeetingItem[]>([]);
  const [pastMeetings, setPastMeetings] = useState<MeetingItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingItem | null>(null);
  const [endingId, setEndingId] = useState<string | null>(null);

  const fetchMeetings = async () => {
    if (!selectedGroup) return;
    try {
      setIsLoading(true);
      const data = await getGroupMeetings(selectedGroup.id);
      setOngoingMeetings(data.ongoing_meetings || []);
      setPastMeetings(data.past_meetings || []);
    } catch (err) {
      console.error("Failed to load meetings:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, [selectedGroup?.id]);

  const handleEndMeeting = async (e: React.MouseEvent, meetingId: string) => {
    e.stopPropagation();
    if (!selectedGroup) return;

    try {
      setEndingId(meetingId);
      await endGroupMeeting(selectedGroup.id, meetingId);
      toast.success("Meeting ended and queued for transcription analysis!");
      fetchMeetings();
    } catch (err: any) {
      toast.error(err.message || "Failed to end meeting");
    } finally {
      setEndingId(null);
    }
  };

  const handleJoinLive = (e: React.MouseEvent, m: MeetingItem) => {
    e.stopPropagation();
    if (onEnterLiveRoom) {
      onEnterLiveRoom({
        meetingId: m.id,
        roomName: m.external_id || `room-${m.id.slice(0, 8)}`,
        title: m.title,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Meetings Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl border border-white/10 bg-slate-900/70 backdrop-blur-2xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <h2 className="text-xl font-bold tracking-tight text-white">
              {selectedGroup ? `${selectedGroup.name} Meetings` : "Meetings Workspace"}
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Real-time LiveKit audio rooms, speech-to-text transcriptions, and commitment extraction.
          </p>
        </div>

        <button
          onClick={onOpenNewMeeting}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-lg shadow-blue-600/20 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ New Meeting</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-3">
          <Loader2 className="w-7 h-7 animate-spin text-cyan-400" />
          <span className="text-xs font-medium">Loading group meetings...</span>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Ongoing Live Meetings Section */}
          {ongoingMeetings.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-400">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span>Live Ongoing Meetings ({ongoingMeetings.length})</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ongoingMeetings.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => setSelectedMeeting(m)}
                    className="relative overflow-hidden rounded-3xl border border-rose-500/30 bg-rose-950/20 p-6 backdrop-blur-xl transition-all duration-300 hover:border-rose-500/50 hover:shadow-2xl hover:shadow-rose-500/10 cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs mb-3">
                        <div className="flex items-center gap-2 text-rose-300 font-semibold">
                          <Radio className="w-4 h-4 animate-pulse text-rose-400" />
                          <span>Live Session Active</span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-400">
                          {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-white mb-2">{m.title}</h3>
                      <p className="text-xs text-slate-400 mb-4">
                        Source: {m.source} • Meeting ID: {m.id.slice(0, 8)}...
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/5 text-xs gap-2">
                      <button
                        onClick={(e) => handleJoinLive(e, m)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                      >
                        <Headphones className="w-3.5 h-3.5" />
                        Join Audio Room
                      </button>

                      <button
                        onClick={(e) => handleEndMeeting(e, m.id)}
                        disabled={endingId === m.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-md shadow-rose-600/20 transition-all cursor-pointer"
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
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <Clock className="w-4 h-4" />
              <span>Past Meetings & Transcriptions ({pastMeetings.length})</span>
            </div>

            {pastMeetings.length === 0 && ongoingMeetings.length === 0 ? (
              <div className="p-12 text-center rounded-3xl border border-dashed border-white/10 bg-slate-900/40">
                <Video className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-slate-200">No meetings recorded yet</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Upload an audio recording or start a live room to automatically generate transcripts and commitments.
                </p>
                <button
                  onClick={onOpenNewMeeting}
                  className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 cursor-pointer inline-flex items-center gap-2"
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
                    className="group relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-xl transition-all duration-300 hover:border-blue-500/40 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/10 cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/20">
                            <Video className="w-3.5 h-3.5" />
                          </span>
                          <span className="font-semibold text-slate-300">
                            {new Date(m.created_at).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-300">
                          {m.status}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors mb-2">
                        {m.title}
                      </h3>
                      <p className="text-xs text-slate-400 mb-4">
                        Source: {m.source} • ID: {m.id.slice(0, 8)}...
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/5 text-xs text-slate-400">
                      <span className="flex items-center gap-1 text-cyan-400 font-medium">
                        <FileText className="w-3.5 h-3.5" />
                        View Transcripts & Commitments
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Meeting Detail Modal for Transcripts & Commitments */}
      <MeetingDetailModal
        meeting={selectedMeeting}
        onClose={() => setSelectedMeeting(null)}
        onSelectCommitment={onSelectCommitment}
      />
    </div>
  );
};
