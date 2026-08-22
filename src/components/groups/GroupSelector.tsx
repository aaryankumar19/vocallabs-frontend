import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Users,
  Plus,
  Mail,
  Check,
  X,
  ChevronDown,
  Building2,
  Sparkles,
  Loader2,
  UserPlus,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  Group,
  Invitation,
  getMyGroups,
  createGroup,
  inviteToGroup,
  getMyInvitations,
  acceptInvitation,
  rejectInvitation,
} from "@/lib/api";
import { toast } from "sonner";

interface GroupSelectorProps {
  selectedGroup: Group | null;
  onSelectGroup: (group: Group | null) => void;
  onGroupsUpdated?: () => void;
}

export const GroupSelector: React.FC<GroupSelectorProps> = ({
  selectedGroup,
  onSelectGroup,
  onGroupsUpdated,
}) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showInvitationsModal, setShowInvitationsModal] = useState(false);

  const [newGroupName, setNewGroupName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingInvId, setProcessingInvId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [userGroups, userInvs] = await Promise.all([
        getMyGroups().catch(() => []),
        getMyInvitations().catch(() => []),
      ]);
      setGroups(userGroups);
      setInvitations(userInvs);

      if (userGroups.length > 0 && !selectedGroup) {
        onSelectGroup(userGroups[0] ?? null);
      }
    } catch (err: any) {
      console.error("Failed to load groups data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    try {
      setIsSubmitting(true);
      const created = await createGroup(newGroupName.trim());
      toast.success(`Group "${created.name}" created successfully!`);
      setGroups((prev) => [...prev, created]);
      onSelectGroup(created);
      setNewGroupName("");
      setShowCreateModal(false);
      if (onGroupsUpdated) onGroupsUpdated();
    } catch (err: any) {
      toast.error(err.message || "Failed to create group");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup || !inviteEmail.trim()) return;

    try {
      setIsSubmitting(true);
      await inviteToGroup(selectedGroup.id, inviteEmail.trim());
      toast.success(`Invitation sent to ${inviteEmail}!`);
      setInviteEmail("");
      setShowInviteModal(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to send invitation");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcceptInvite = async (inv: Invitation) => {
    try {
      setProcessingInvId(inv.id);
      await acceptInvitation(inv.id);
      toast.success(`Joined group "${inv.group_name || 'workspace'}"!`);
      setInvitations((prev) => prev.filter((i) => i.id !== inv.id));
      await loadData();
      if (onGroupsUpdated) onGroupsUpdated();
    } catch (err: any) {
      toast.error(err.message || "Failed to accept invitation");
    } finally {
      setProcessingInvId(null);
    }
  };

  const handleRejectInvite = async (inv: Invitation) => {
    try {
      setProcessingInvId(inv.id);
      await rejectInvitation(inv.id);
      toast.info("Invitation declined");
      setInvitations((prev) => prev.filter((i) => i.id !== inv.id));
    } catch (err: any) {
      toast.error(err.message || "Failed to reject invitation");
    } finally {
      setProcessingInvId(null);
    }
  };

  return (
    <div className="relative">
      {/* Group Switcher Button */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#D1F2EE]/30 border border-[#B7E6DF] text-xs font-semibold text-[#0F292B] transition-all shadow-2xs hover:shadow-xs cursor-pointer"
          >
            <div className="w-5 h-5 rounded-lg bg-[#D1F2EE] border border-[#B7E6DF] flex items-center justify-center text-[#0D9488]">
              <Building2 className="w-3 h-3" />
            </div>
            <span className="max-w-[140px] truncate">
              {selectedGroup ? selectedGroup.name : isLoading ? "Loading..." : "Select Group"}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Dropdown Menu */}
          {isOpen && (
            <div className="absolute left-0 mt-2 w-64 rounded-2xl border border-[#B7E6DF] bg-[#F3FFFE]/98 p-2 shadow-xl backdrop-blur-2xl z-50 animate-in fade-in duration-150">
              <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#115E59]">
                Your Groups
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1 py-1">
                {groups.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-slate-500">No groups yet. Create one!</div>
                ) : (
                  groups.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => {
                        onSelectGroup(g);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                        selectedGroup?.id === g.id
                          ? "bg-[#D1F2EE] text-[#0F292B] border border-[#B7E6DF] font-semibold"
                          : "text-[#0F292B] hover:bg-[#E6F2FF]/60 hover:text-[#0D9488]"
                      }`}
                    >
                      <span className="truncate">{g.name}</span>
                      {selectedGroup?.id === g.id && <Check className="w-3.5 h-3.5 text-[#0D9488]" />}
                    </button>
                  ))
                )}
              </div>

              <div className="pt-2 mt-1 border-t border-[#D1F2EE] space-y-1">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setShowCreateModal(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs text-[#0D9488] hover:bg-[#D1F2EE] font-semibold cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create New Group</span>
                </button>

                {selectedGroup && (
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      setShowInviteModal(true);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs text-[#115E59] hover:bg-[#E6F2FF] font-medium cursor-pointer transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-[#0284C7]" />
                    <span>Invite Team Member</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Pending Invitations Badge Button */}
        {invitations.length > 0 && (
          <button
            onClick={() => setShowInvitationsModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F9EAF0] border border-[#B7E6DF] text-[#9D174D] text-xs font-semibold hover:bg-[#F9EAF0]/90 transition-all cursor-pointer shadow-2xs"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#BE185D] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#BE185D]"></span>
            </span>
            <Mail className="w-3.5 h-3.5 text-[#BE185D]" />
            <span>{invitations.length} Invites</span>
          </button>
        )}
      </div>

      {/* Create Group Modal (Rendered via Portal on document.body) */}
      {showCreateModal &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F292B]/50 backdrop-blur-md animate-in fade-in">
            <div className="relative w-full max-w-md rounded-3xl border border-[#B7E6DF] bg-[#F3FFFE] p-6 sm:p-7 shadow-2xl backdrop-blur-2xl">
              <button
                onClick={() => setShowCreateModal(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-[#0F292B] p-1.5 rounded-xl hover:bg-[#D1F2EE] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-[#D1F2EE] border border-[#B7E6DF] flex items-center justify-center text-[#0D9488]">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0F292B]">Create New Group</h3>
                  <p className="text-xs text-[#115E59]">Collaborate with your team on meetings and follow-throughs</p>
                </div>
              </div>

              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#115E59] mb-1.5">
                    Group Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="e.g. Core Engineering, Product Pod"
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#B7E6DF] text-sm text-[#0F292B] placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#0D9488] focus:ring-2 focus:ring-[#D1F2EE]"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-[#0F292B] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#0D9488] hover:bg-[#0F766E] shadow-sm shadow-[#0D9488]/20 disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    Create Group
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* Invite Member Modal (Rendered via Portal on document.body) */}
      {showInviteModal &&
        selectedGroup &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F292B]/50 backdrop-blur-md animate-in fade-in">
            <div className="relative w-full max-w-md rounded-3xl border border-[#B7E6DF] bg-[#F3FFFE] p-6 sm:p-7 shadow-2xl backdrop-blur-2xl">
              <button
                onClick={() => setShowInviteModal(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-[#0F292B] p-1.5 rounded-xl hover:bg-[#D1F2EE] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-[#E6F2FF] border border-[#B7E6DF] flex items-center justify-center text-[#0284C7]">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0F292B]">Invite to {selectedGroup.name}</h3>
                  <p className="text-xs text-[#115E59]">Send an invitation email to add a teammate</p>
                </div>
              </div>

              <form onSubmit={handleInviteMember} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#115E59] mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#B7E6DF] text-sm text-[#0F292B] placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#0D9488] focus:ring-2 focus:ring-[#D1F2EE]"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-[#0F292B] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[#0D9488] to-[#0284C7] hover:from-[#0F766E] hover:to-[#0369A1] shadow-sm shadow-[#0D9488]/20 disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                    Send Invitation
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* Invitations List Modal (Rendered via Portal on document.body for true viewport centering) */}
      {showInvitationsModal &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#0F292B]/50 backdrop-blur-md animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg rounded-3xl border border-[#B7E6DF] bg-[#F3FFFE] p-6 sm:p-8 shadow-2xl backdrop-blur-2xl">
              {/* Close Button */}
              <button
                onClick={() => setShowInvitationsModal(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-[#0F292B] p-2 rounded-xl hover:bg-[#D1F2EE] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Header */}
              <div className="flex items-center gap-3.5 mb-6 pb-4 border-b border-[#D1F2EE]">
                <div className="w-11 h-11 rounded-2xl bg-[#F9EAF0] border border-[#B7E6DF] flex items-center justify-center text-[#BE185D] shadow-2xs">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#0F292B] tracking-tight">Pending Workspace Invitations</h3>
                  <p className="text-xs text-[#115E59]">Groups and workspaces you have been invited to join</p>
                </div>
              </div>

              {/* Invitations List */}
              <div className="space-y-3 max-h-80 overflow-y-auto py-1 pr-1">
                {invitations.length === 0 ? (
                  <div className="text-center py-10 rounded-2xl border border-dashed border-[#B7E6DF] bg-white text-slate-500 space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-[#0D9488] mx-auto" />
                    <p className="text-xs font-semibold text-[#0F292B]">All caught up!</p>
                    <p className="text-[11px] text-[#115E59]">No pending invitations waiting for your response.</p>
                  </div>
                ) : (
                  invitations.map((inv) => {
                    const isProcessing = processingInvId === inv.id;
                    const groupInitial = (inv.group_name || "W").charAt(0).toUpperCase();

                    return (
                      <div
                        key={inv.id}
                        className="p-4 rounded-2xl bg-white border border-[#B7E6DF] hover:border-[#0D9488] transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3.5"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#D1F2EE] to-[#E6F2FF] border border-[#B7E6DF] flex items-center justify-center text-sm font-bold text-[#0D9488] shrink-0">
                            {groupInitial}
                          </div>
                          <div className="min-w-0">
                            <span className="block text-sm font-bold text-[#0F292B] truncate">
                              {inv.group_name || "Team Workspace"}
                            </span>
                            <span className="block text-xs text-[#115E59] truncate">
                              Invited by <strong className="text-[#0F292B] font-semibold">{inv.inviter_name || "Team Member"}</strong>
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                          <button
                            onClick={() => handleAcceptInvite(inv)}
                            disabled={isProcessing}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-semibold shadow-xs shadow-[#0D9488]/20 transition-all cursor-pointer disabled:opacity-50"
                          >
                            {isProcessing ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                            <span>Accept</span>
                          </button>

                          <button
                            onClick={() => handleRejectInvite(inv)}
                            disabled={isProcessing}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F9EAF0] hover:bg-rose-100 text-[#9D174D] border border-[#B7E6DF] text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Decline</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Modal Footer */}
              <div className="mt-6 pt-4 border-t border-[#D1F2EE] flex justify-end">
                <button
                  onClick={() => setShowInvitationsModal(false)}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-[#0F292B] bg-[#D1F2EE] hover:bg-[#B7E6DF] transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
