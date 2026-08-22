/**
 * Authentication Service for VocalLabs
 * Google Identity Services (GSI) id_token flow -> FastAPI POST /api/v1/auth/
 *
 * Backend contract: POST /api/v1/auth/ { email, name } -> { auth_token, name, email, groups }
 */

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  full_name?: string;
  avatar_url?: string;
  picture?: string;
  groups?: unknown[];
}

export interface AuthSession {
  token: string;
  user: AuthUser;
  expires_at?: number;
}

const STORAGE_KEY = "vocallabs_auth_session";
const AUTH_EVENT_NAME = "vocallabs-auth-change";

export const FASTAPI_BACKEND_URL =
  (import.meta.env["VITE_FASTAPI_BACKEND_URL"] as string) || "http://192.168.137.116:8000";

export const GOOGLE_CLIENT_ID = (import.meta.env["VITE_GOOGLE_CLIENT_ID"] as string) || "";

export function isGoogleConfigured(): boolean {
  return (
    Boolean(GOOGLE_CLIENT_ID) &&
    !GOOGLE_CLIENT_ID.includes("YOUR_GOOGLE_CLIENT_ID")
  );
}

// -----------------------------------------------------------------------
// FastAPI Backend Auth - the ONLY backend call needed
// POST /api/v1/auth/  body: { email, name }
// -----------------------------------------------------------------------

export async function authenticateWithBackend(
  email: string,
  name: string,
  picture?: string | undefined,
): Promise<AuthSession> {
  const url = `${FASTAPI_BACKEND_URL}/api/v1/auth/`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ email, name }),
  });

  if (!response.ok) {
    const errJson = await response.json().catch(() => ({})) as Record<string, unknown>;
    throw new Error(
      (errJson["detail"] as string) ||
        (errJson["message"] as string) ||
        `Backend auth failed (HTTP ${response.status})`,
    );
  }

  const data = await response.json() as Record<string, unknown>;

  // Backend returns: { auth_token, name, email, groups }
  const session: AuthSession = {
    token:
      (data["auth_token"] as string) ||
      (data["token"] as string) ||
      (data["access_token"] as string) ||
      "",
    user: {
      id: (data["id"] as string) || email,
      email: (data["email"] as string) || email,
      name: (data["name"] as string) || name,
      full_name: (data["name"] as string) || name,
      ...(picture !== undefined ? { picture } : {}),
      groups: data["groups"] as unknown[],
    },
    expires_at: (data["expires_at"] as number) || Date.now() + 86400 * 1000 * 7,
  };

  setAuthSession(session);
  return session;
}

// -----------------------------------------------------------------------
// JWT decoder (id_token payload only, no signature verification)
// -----------------------------------------------------------------------

export function decodeJwtPayload(token: string): Record<string, string | undefined> {
  try {
    const base64 = (token.split(".")[1] ?? "").replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(json) as Record<string, string | undefined>;
  } catch {
    return {};
  }
}

/**
 * Initiates the standard Google OAuth 2.0 flow (direct redirect).
 * Does not depend on third-party scripts/GIS loading.
 */
export function initiateGoogleOAuthRedirect(): void {
  if (typeof window === "undefined") return;

  const callbackUrl = getCallbackUrl();
  const clientId = (GOOGLE_CLIENT_ID || "").trim();

  const nonce = Math.random().toString(36).substring(2, 15);
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUrl,
    response_type: "token id_token",
    scope: "openid email profile",
    nonce: nonce,
    prompt: "select_account",
  });

  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Fetches user profile from Google's standard userinfo endpoint using access_token.
 */
export async function fetchGoogleUserInfo(accessToken: string): Promise<{
  email: string;
  name: string;
  picture?: string | undefined;
}> {
  const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Google profile (HTTP ${response.status})`);
  }

  const data = (await response.json()) as {
    email?: string;
    name?: string;
    picture?: string;
  };

  const email = data.email ?? "";
  const name = data.name ?? (email.split("@")[0] ?? email);
  const picture = data.picture;

  return { email, name, picture };
}

// -----------------------------------------------------------------------
// Optional Google Identity Services (GIS) integration
// -----------------------------------------------------------------------

type GISCallback = (response: { credential?: string; error?: string }) => void;

interface GISConfig {
  client_id: string;
  callback: GISCallback;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
}

interface GISNotification {
  isNotDisplayed: () => boolean;
  isSkippedMoment: () => boolean;
}

interface GISId {
  initialize: (config: GISConfig) => void;
  prompt: (notification?: (n: GISNotification) => void) => void;
  renderButton: (container: HTMLElement | null, options: Record<string, unknown>) => void;
}

type GISWindow = Window & {
  google?: {
    accounts?: unknown;
    id?: GISId;
  };
};

function getGIS(): GISWindow["google"] {
  return (window as GISWindow).google;
}

export function waitForGIS(onSuccess: () => void, onError: (errorMsg: string) => void): void {
  if (typeof window === "undefined") return;

  const check = () => {
    const google = getGIS();
    return Boolean(google?.accounts && google?.id);
  };

  if (check()) {
    onSuccess();
    return;
  }

  const startTime = Date.now();
  const interval = setInterval(() => {
    if (check()) {
      clearInterval(interval);
      onSuccess();
    } else if (Date.now() - startTime > 4000) {
      clearInterval(interval);
      onError("GIS not available.");
    }
  }, 50);
}

export async function handleCredential(
  credential: string,
  onSuccess: (session: AuthSession) => void,
  onError: (message: string) => void,
): Promise<void> {
  const payload = decodeJwtPayload(credential);
  const email: string = payload["email"] ?? "";
  const nameFallback: string = (email.split("@")[0]) ?? email;
  const name: string = payload["name"] ?? payload["given_name"] ?? nameFallback;
  const picture: string | undefined = payload["picture"];

  if (!email) {
    onError("Could not extract email from Google account.");
    return;
  }

  try {
    const session = await authenticateWithBackend(email, name, picture);
    onSuccess(session);
  } catch (err: unknown) {
    onError(
      err instanceof Error
        ? err.message
        : "Failed to authenticate with backend server.",
    );
  }
}

// -----------------------------------------------------------------------
// Public Google Sign-In functions
// -----------------------------------------------------------------------

/**
 * Triggers the Google Identity Services One Tap prompt.
 * On success, calls backend and resolves with AuthSession.
 */
export function initiateGoogleLogin(
  onSuccess: (session: AuthSession) => void,
  onError: (message: string) => void,
): void {
  // If GIS is not loaded, fallback seamlessly to direct OAuth redirect
  initiateGoogleOAuthRedirect();
}

/**
 * Renders an official Google Sign-In button inside a DOM element.
 */
export function renderGoogleButton(
  containerId: string,
  onSuccess: (session: AuthSession) => void,
  onError: (message: string) => void,
): void {
  if (typeof window === "undefined") return;
  if (!isGoogleConfigured()) {
    onError("Google Client ID is not configured.");
    return;
  }

  waitForGIS(
    () => {
      const google = getGIS();
      const container = document.getElementById(containerId);
      if (!google?.id || !container) {
        onError("Google Sign-In button container not ready.");
        return;
      }

      google.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          if (response.error || !response.credential) {
            onError(response.error || "No credential from Google.");
            return;
          }
          void handleCredential(response.credential, onSuccess, onError);
        },
        auto_select: false,
      });

      container.innerHTML = "";
      google.id.renderButton(container, {
        type: "standard",
        theme: "filled_black",
        size: "large",
        text: "continue_with",
        shape: "pill",
        logo_alignment: "left",
        width: 320,
      });
    },
    (err) => onError(err || "Failed to load Google Sign-In library."),
  );
}

// -----------------------------------------------------------------------
// Session helpers
// -----------------------------------------------------------------------

export function setAuthSession(session: AuthSession): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    window.dispatchEvent(new CustomEvent(AUTH_EVENT_NAME, { detail: session }));
  } catch (err) {
    console.error("Failed to save auth session:", err);
  }
}

export function getAuthSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export function getAuthUser(): AuthUser | null {
  return getAuthSession()?.user || null;
}

export function getAuthToken(): string | null {
  return getAuthSession()?.token || null;
}

export function isAuthenticated(): boolean {
  return Boolean(getAuthSession()?.token);
}

export function logout(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(AUTH_EVENT_NAME, { detail: null }));
  } catch (err) {
    console.error("Failed to logout:", err);
  }
}

export function onAuthStateChanged(
  callback: (session: AuthSession | null) => void,
): () => void {
  if (typeof window === "undefined") return () => {};

  const handler = (e: Event) => {
    const customEvent = e as CustomEvent<AuthSession | null>;
    callback(customEvent.detail ?? getAuthSession());
  };

  const storageHandler = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      callback(getAuthSession());
    }
  };

  window.addEventListener(AUTH_EVENT_NAME, handler);
  window.addEventListener("storage", storageHandler);

  return () => {
    window.removeEventListener(AUTH_EVENT_NAME, handler);
    window.removeEventListener("storage", storageHandler);
  };
}

// -----------------------------------------------------------------------
// Legacy email helpers (backend uses email as identity, no passwords)
// -----------------------------------------------------------------------

export async function loginWithEmail(
  email: string,
  _password: string,
): Promise<AuthSession> {
  return authenticateWithBackend(email, email.split("@")[0] ?? email);
}

export async function signupWithEmail(
  email: string,
  _password: string,
  fullName: string,
): Promise<AuthSession> {
  return authenticateWithBackend(email, fullName || (email.split("@")[0] ?? email));
}

// Kept for backwards compatibility
export function getCallbackUrl(): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/auth/callback`;
  }
  return "http://localhost:5173/auth/callback";
}
