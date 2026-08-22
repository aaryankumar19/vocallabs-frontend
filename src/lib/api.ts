/**
 * VocalLabs FastAPI Backend API Client
 * Endpoints verified against live OpenAPI spec at http://192.168.137.116:8000/openapi.json
 */
import { getAuthToken } from "./auth";

export const BACKEND_URL =
  (import.meta.env["VITE_FASTAPI_BACKEND_URL"] as string) || "http://192.168.137.116:8000";

// --------------------------------------------------------------------------
// Shared Types — matched 1:1 against OpenAPI schemas
// --------------------------------------------------------------------------

export interface GroupMember {
  id: string;
  group_id: string;
  member_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

/** Matches both UserGroupItem (from /mygroups) and GroupOut (from /groups/{id}) */
export interface Group {
  id: string;
  name: string;
  created_by?: string | null;
  created_at?: string | null;
  status?: string | null;
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

/** Matches GroupMeetingOut in OpenAPI spec */
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

/** Matches GroupMeetingsCategorizedResponse in OpenAPI spec */
export interface CategorizedMeetings {
  group_id: string;
  group_name: string;
  ongoing_meetings: MeetingItem[];
  past_meetings: MeetingItem[];
}

/** Matches StartGroupMeetingResponse in OpenAPI spec */
export interface StartMeetingResponse {
  meeting_id: string;
  group_id: string;
  title: string;
  status: string;
  room_name: string;
  token: string;
  livekit_url: string;
}

/** Matches TokenResponse (GET /api/v1/livekit/token) in OpenAPI spec */
export interface LiveKitTokenResponse {
  meeting_id: string;
  token: string;
  livekit_url: string;
  room_name: string;
  identity: string;
}

/**
 * Matches CommitmentWithMeetingOut in OpenAPI spec.
 * NOTE: The API uses owner_id (UUID) not owner/assignee strings,
 *       and extraction_confidence not confidence.
 */
export interface ApiCommitment {
  id: string;
  meeting_id: string;
  title: string;
  description?: string | null;
  status: string; // "pending" | "in_progress" | "completed" | "at_risk" | "needs_review"
  owner_id?: string | null;
  /** Alias for display — same as owner_id */
  owner?: string | null;
  assignee?: string | null;
  deadline?: string | null;
  extraction_confidence?: number | null;
  /** Alias — same as extraction_confidence */
  confidence?: number | null;
  verification_confidence?: number | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
  meeting?: MeetingSimpleOut | null;
}

/** Matches MeetingSimpleOut nested in CommitmentWithMeetingOut */
export interface MeetingSimpleOut {
  id: string;
  title: string;
  source: string;
  status: string;
  group_id?: string | null;
  created_by?: string | null;
  started_at?: string | null;
  created_at: string;
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

// --------------------------------------------------------------------------
// Core fetch wrapper with automatic auth token injection
// --------------------------------------------------------------------------
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...((options.headers as Record<string, string>) || {}),
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
      if (Array.isArray(errJson.detail)) {
        // FastAPI validation errors are arrays of {loc, msg, type}
        errorDetail = errJson.detail
          .map((e: any) => e.msg || e.detail || JSON.stringify(e))
          .join("; ");
      } else {
        errorDetail = errJson.detail || errJson.message || JSON.stringify(errJson);
      }
    } catch {
      // fallback to status text
      errorDetail = `${errorDetail} — ${response.statusText}`;
    }
    throw new Error(errorDetail);
  }

  // Handle empty 204 responses
  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    return {} as T;
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
// Auth
// --------------------------------------------------------------------------
export async function authenticateUser(email: string, name: string) {
  // POST /api/v1/auth  (no trailing slash — confirmed in spec)
  return request<{ auth_token: string; name: string; email: string; groups: Group[] }>(
    "/api/v1/auth",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name }),
    },
  );
}

// --------------------------------------------------------------------------
// Groups
// --------------------------------------------------------------------------

/**
 * GET /api/v1/mygroups
 * FIXED: was incorrectly calling /api/v1/auth/mygroups which does not exist.
 */
export async function getMyGroups(): Promise<Group[]> {
  return request<Group[]>("/api/v1/mygroups");
}

export async function createGroup(name: string): Promise<Group> {
  // POST /api/v1/groups  — returns 201 with GroupOut
  return request<Group>("/api/v1/groups", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
}

export async function getGroupDetails(groupId: string): Promise<Group> {
  return request<Group>(`/api/v1/groups/${groupId}`);
}

export async function inviteToGroup(groupId: string, email: string): Promise<Invitation> {
  // POST /api/v1/groups/{group_id}/invite  body: InvitationCreate { email: string }
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

/**
 * POST /api/v1/groups/{group_id}/meetings
 * Body: StartGroupMeetingRequest { title?: string, room_name?: string }
 * Returns: StartGroupMeetingResponse (201)
 */
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
      ...(roomName ? { room_name: roomName } : {}),
    }),
  });
}

/**
 * POST /api/v1/groups/{group_id}/meetings/{meeting_id}/end
 * Returns: GroupMeetingOut (200)
 */
export async function endGroupMeeting(groupId: string, meetingId: string): Promise<MeetingItem> {
  return request<MeetingItem>(`/api/v1/groups/${groupId}/meetings/${meetingId}/end`, {
    method: "POST",
  });
}

export async function getMeetingDetails(meetingId: string): Promise<MeetingItem> {
  return request<MeetingItem>(`/api/v1/meetings/${meetingId}`);
}

export async function getMeetingTranscripts(meetingId: string): Promise<TranscriptItem[]> {
  return request<TranscriptItem[]>(`/api/v1/transcripts/meeting/${meetingId}`);
}

/**
 * POST /api/v1/meetings/transcribe
 * Multipart form: file (required), title (optional), model (optional), language (optional)
 * NOTE: group_id is NOT in the spec schema for this endpoint — removed to prevent 422.
 */
export async function transcribeAudioFile(
  file: File,
  title?: string,
  _groupId?: string, // kept for compatibility but NOT sent — not in spec
): Promise<any> {
  const token = getAuthToken();
  const formData = new FormData();
  formData.append("file", file);
  if (title) formData.append("title", title);
  // model defaults to "small" in the spec

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
      if (Array.isArray(j.detail)) {
        err = j.detail.map((e: any) => e.msg || JSON.stringify(e)).join("; ");
      } else {
        err = j.detail || j.message || err;
      }
    } catch {}
    throw new Error(err);
  }

  return response.json();
}

/**
 * POST /api/v1/livekit/token
 * Body: TokenRequest { room_name, identity, name?, group_id? }
 */
export async function getLiveKitToken(
  roomName: string,
  identity: string,
  name?: string,
  groupId?: string | null,
): Promise<LiveKitTokenResponse> {
  return request<LiveKitTokenResponse>("/api/v1/livekit/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      room_name: roomName,
      identity,
      name: name || identity,
      ...(groupId ? { group_id: groupId } : {}),
    }),
  });
}

// --------------------------------------------------------------------------
// Commitments
// --------------------------------------------------------------------------

/**
 * GET /api/v1/commitments
 * Returns CommitmentWithMeetingOut[]
 * Optionally pass group_id query param to scope to a group.
 */
export async function getCommitments(groupId?: string): Promise<ApiCommitment[]> {
  const url = groupId ? `/api/v1/commitments?group_id=${groupId}` : "/api/v1/commitments";
  const raw = await request<ApiCommitment[]>(url);

  // Normalize field name aliases for display components
  return (raw || []).map((c) => ({
    ...c,
    owner: c.owner || c.owner_id || null,
    confidence: c.confidence ?? c.extraction_confidence ?? null,
  }));
}

export async function getCommitmentById(commitmentId: string): Promise<ApiCommitment> {
  const raw = await request<ApiCommitment>(`/api/v1/commitments/${commitmentId}`);
  return {
    ...raw,
    owner: raw.owner || raw.owner_id || null,
    confidence: raw.confidence ?? raw.extraction_confidence ?? null,
  };
}

export async function getMeetingCommitments(meetingId: string): Promise<ApiCommitment[]> {
  const raw = await request<ApiCommitment[]>(`/api/v1/commitments/meeting/${meetingId}`);
  return (raw || []).map((c) => ({
    ...c,
    owner: c.owner || c.owner_id || null,
    confidence: c.confidence ?? c.extraction_confidence ?? null,
  }));
}

/**
 * POST /api/v1/commitments/analyze
 * Body: CommitmentAnalyzeRequest { meeting_id: UUID }
 */
export async function analyzeMeetingCommitments(meetingId: string): Promise<any> {
  return request<any>("/api/v1/commitments/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ meeting_id: meetingId }),
  });
}

/**
 * POST /api/v1/commitments/{commitment_id}/verify
 */
export async function verifyCommitment(commitmentId: string): Promise<any> {
  return request<any>(`/api/v1/commitments/${commitmentId}/verify`, {
    method: "POST",
  });
}
