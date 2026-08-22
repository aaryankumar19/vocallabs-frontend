/**
 * VocalLabs FastAPI Backend API Client
 * Connects directly to FastAPI backend services for Groups, Meetings, LiveKit,
 * Transcriptions STT, Commitments Extraction & Verification.
 */
import { getAuthToken } from "./auth";

export const BACKEND_URL =
  (import.meta.env["VITE_FASTAPI_BACKEND_URL"] as string) || "http://192.168.137.116:8000";

export interface GroupMember {
  id: string;
  group_id: string;
  member_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Group {
  id: string;
  name: string;
  created_by?: string | null;
  created_at: string;
  members?: GroupMember[];
}

export interface Invitation {
  id: string;
  email: string;
  group_id: string;
  group_name?: string | null;
  invited_by: string;
  inviter_name?: string | null;
  invited_at: string;
  status: string;
}

export interface MeetingItem {
  id: string;
  group_id?: string | null;
  created_by?: string | null;
  title: string;
  source: string;
  external_id?: string | null;
  status: string;
  started_at?: string | null;
  ended_at?: string | null;
  created_at: string;
}

export interface CategorizedMeetings {
  group_id: string;
  group_name: string;
  ongoing_meetings: MeetingItem[];
  past_meetings: MeetingItem[];
}

export interface StartMeetingResponse {
  meeting_id: string;
  group_id: string;
  title: string;
  status: string;
  room_name: string;
  token: string;
  livekit_url: string;
}

export interface LiveKitTokenResponse {
  meeting_id: string;
  token: string;
  livekit_url: string;
  room_name: string;
  identity: string;
}

export interface ApiCommitment {
  id: string;
  meeting_id: string;
  title: string;
  description?: string | null;
  status: string; // "pending" | "in_progress" | "completed" | "at_risk" | "needs_review"
  owner?: string | null;
  assignee?: string | null;
  deadline?: string | null;
  confidence?: number | null;
  verification_confidence?: number | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
  meeting?: {
    id: string;
    title: string;
    source: string;
    status: string;
    group_id?: string | null;
    created_by?: string | null;
    started_at?: string | null;
    created_at: string;
  } | null;
}

export interface TranscriptItem {
  id?: string;
  speaker?: string;
  text: string;
  timestamp?: string;
  start_time?: number;
  end_time?: number;
}

export interface HealthResponse {
  status: string;
  database?: string;
  whisper_stt?: {
    status: string;
    provider: string;
    url?: string;
  };
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
    headers["x-auth-token"] = token;
  }

  const url = endpoint.startsWith("http") ? endpoint : `${BACKEND_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = `Request failed (HTTP ${response.status})`;
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errJson.message || JSON.stringify(errJson);
      if (Array.isArray(errorDetail)) {
        errorDetail = errorDetail.map((e: any) => e.msg || e.detail).join(", ");
      }
    } catch {
      // fallback
    }
    throw new Error(errorDetail);
  }

  return response.json() as Promise<T>;
}

// --------------------------------------------------------------------------
// Health
// --------------------------------------------------------------------------
export async function getBackendHealth(): Promise<HealthResponse> {
  return request<HealthResponse>("/api/v1/health");
}

// --------------------------------------------------------------------------
// Groups
// --------------------------------------------------------------------------
export async function getMyGroups(): Promise<Group[]> {
  return request<Group[]>("/api/v1/auth/mygroups");
}

export async function createGroup(name: string): Promise<Group> {
  return request<Group>("/api/v1/groups/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
}

export async function getGroupDetails(groupId: string): Promise<Group> {
  return request<Group>(`/api/v1/groups/${groupId}`);
}

export async function inviteToGroup(groupId: string, email: string): Promise<Invitation> {
  return request<Invitation>(`/api/v1/groups/${groupId}/invite`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
}

// --------------------------------------------------------------------------
// Invitations
// --------------------------------------------------------------------------
export async function getMyInvitations(): Promise<Invitation[]> {
  return request<Invitation[]>("/api/v1/my-invitations");
}

export async function acceptInvitation(invitationId: string): Promise<Invitation> {
  return request<Invitation>(`/api/v1/invitations/${invitationId}/accept`, {
    method: "POST",
  });
}

export async function rejectInvitation(invitationId: string): Promise<Invitation> {
  return request<Invitation>(`/api/v1/invitations/${invitationId}/reject`, {
    method: "POST",
  });
}

// --------------------------------------------------------------------------
// Meetings & LiveKit
// --------------------------------------------------------------------------
export async function getGroupMeetings(groupId: string): Promise<CategorizedMeetings> {
  return request<CategorizedMeetings>(`/api/v1/groups/${groupId}/meetings`);
}

export async function startGroupMeeting(
  groupId: string,
  title?: string,
  roomName?: string,
): Promise<StartMeetingResponse> {
  return request<StartMeetingResponse>(`/api/v1/groups/${groupId}/meetings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: title || "Live Team Meeting",
      room_name: roomName,
    }),
  });
}

export async function endGroupMeeting(
  groupId: string,
  meetingId: string,
): Promise<{ message: string; meeting_id: string; status: string }> {
  return request<{ message: string; meeting_id: string; status: string }>(
    `/api/v1/groups/${groupId}/meetings/${meetingId}/end`,
    {
      method: "POST",
    },
  );
}

export async function getMeetingDetails(meetingId: string): Promise<MeetingItem> {
  return request<MeetingItem>(`/api/v1/meetings/${meetingId}`);
}

export async function getMeetingTranscripts(meetingId: string): Promise<TranscriptItem[]> {
  return request<TranscriptItem[]>(`/api/v1/transcripts/meeting/${meetingId}`);
}

export async function transcribeAudioFile(
  file: File,
  title?: string,
  groupId?: string,
): Promise<any> {
  const token = getAuthToken();
  const formData = new FormData();
  formData.append("file", file);
  if (title) formData.append("title", title);
  if (groupId) formData.append("group_id", groupId);

  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
    headers["x-auth-token"] = token;
  }

  const response = await fetch(`${BACKEND_URL}/api/v1/meetings/transcribe`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!response.ok) {
    let err = `Transcription failed (HTTP ${response.status})`;
    try {
      const j = await response.json();
      err = j.detail || j.message || err;
    } catch {}
    throw new Error(err);
  }

  return response.json();
}

export async function getLiveKitToken(
  roomName: string,
  identity: string,
  name?: string,
  groupId?: string,
): Promise<LiveKitTokenResponse> {
  return request<LiveKitTokenResponse>("/api/v1/livekit/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      room_name: roomName,
      identity,
      name: name || identity,
      group_id: groupId,
    }),
  });
}

// --------------------------------------------------------------------------
// Commitments
// --------------------------------------------------------------------------
export async function getCommitments(): Promise<ApiCommitment[]> {
  return request<ApiCommitment[]>("/api/v1/commitments/");
}

export async function getCommitmentById(commitmentId: string): Promise<ApiCommitment> {
  return request<ApiCommitment>(`/api/v1/commitments/${commitmentId}`);
}

export async function getMeetingCommitments(meetingId: string): Promise<ApiCommitment[]> {
  return request<ApiCommitment[]>(`/api/v1/commitments/meeting/${meetingId}`);
}

export async function analyzeMeetingCommitments(meetingId: string): Promise<any> {
  return request<any>("/api/v1/commitments/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ meeting_id: meetingId }),
  });
}

export async function verifyCommitment(commitmentId: string): Promise<any> {
  return request<any>(`/api/v1/commitments/${commitmentId}/verify`, {
    method: "POST",
  });
}
