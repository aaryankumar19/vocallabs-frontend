import React, { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  authenticateWithBackend,
  decodeJwtPayload,
  fetchGoogleUserInfo,
  setAuthSession,
  FASTAPI_BACKEND_URL,
} from "@/lib/auth";
import {
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Server,
  Sparkles,
} from "lucide-react";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("processing"); // 'processing' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function handleAuth() {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const hash = window.location.hash.replace(/^#/, "");
        const hashParams = new URLSearchParams(hash);

        const error = urlParams.get("error") || hashParams.get("error");
        const errorDescription =
          urlParams.get("error_description") || hashParams.get("error_description");

        if (error) {
          setStatus("error");
          setErrorMessage(
            errorDescription || `Google authentication was rejected (${error}).`,
          );
          return;
        }

        // 1. Check for id_token from Google OAuth
        const idToken = hashParams.get("id_token") || urlParams.get("id_token");
        if (idToken) {
          const payload = decodeJwtPayload(idToken);
          const email = payload["email"];
          const name =
            payload["name"] ||
            payload["given_name"] ||
            (email ? email.split("@")[0] : "Google User");
          const picture = payload["picture"];

          if (email) {
            await authenticateWithBackend(email, name, picture);
            setStatus("success");
            setTimeout(() => {
              navigate({ to: "/dashboard" });
            }, 600);
            return;
          }
        }

        // 2. Check for access_token from Google OAuth
        const accessToken =
          hashParams.get("access_token") || urlParams.get("access_token");
        if (accessToken) {
          const profile = await fetchGoogleUserInfo(accessToken);
          if (profile.email) {
            await authenticateWithBackend(profile.email, profile.name, profile.picture);
            setStatus("success");
            setTimeout(() => {
              navigate({ to: "/dashboard" });
            }, 600);
            return;
          }
        }

        // 3. Check for direct backend token or email
        const token = urlParams.get("token") || hashParams.get("token");
        if (token) {
          setAuthSession({
            token,
            user: {
              id: "fastapi_user",
              email: urlParams.get("email") || "user@example.com",
              name: urlParams.get("name") || "Google User",
            },
          });
          setStatus("success");
          setTimeout(() => {
            navigate({ to: "/dashboard" });
          }, 600);
          return;
        }

        // 4. Fallback redirect to login
        navigate({ to: "/login" });
      } catch (err) {
        console.error("[Auth Callback] Unexpected error:", err);
        setStatus("error");
        setErrorMessage(
          err instanceof Error ? err.message : "An unexpected authentication error occurred.",
        );
      }
    }

    handleAuth();
  }, [navigate]);

  const handleBypassToDemo = () => {
    setAuthSession({
      token: "demo_jwt_token",
      user: {
        id: "demo_user",
        email: "demo@vocallabs.ai",
        name: "Demo Engineer",
      },
    });
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen bg-[#050816] text-[#F8FAFC] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Glass Card */}
      <div className="w-full max-w-md relative z-10 rounded-3xl border border-white/10 bg-slate-900/80 p-8 sm:p-10 backdrop-blur-2xl shadow-2xl shadow-black/90 text-center">
        {/* Status: Processing */}
        {status === "processing" && (
          <div className="space-y-6">
            <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
              <div className="absolute inset-0 rounded-2xl bg-blue-500/20 animate-ping opacity-75" />
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 p-[1px] shadow-lg shadow-blue-500/30 flex items-center justify-center">
                <div className="w-full h-full rounded-[15px] bg-slate-950 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight mb-2">
                Verifying Google Credentials
              </h2>
              <p className="text-xs text-slate-400">
                Exchanging authentication token with FastAPI server at{" "}
                <code className="text-cyan-300 font-mono">{FASTAPI_BACKEND_URL}</code>
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 text-[11px] text-slate-400 font-mono">
              <div className="flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span>Handshaking OAuth 2.0 pipeline...</span>
              </div>
            </div>
          </div>
        )}

        {/* Status: Success */}
        {status === "success" && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight mb-2">
                Authentication Successful!
              </h2>
              <p className="text-xs text-slate-400">
                Welcome to your VocalLabs meeting intelligence workspace. Redirecting you now...
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-emerald-400 font-semibold">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Entering Dashboard</span>
            </div>
          </div>
        )}

        {/* Status: Error */}
        {status === "error" && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-500/20">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight mb-2">
                Authentication Error
              </h2>
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs text-left mb-4">
                {errorMessage}
              </div>
            </div>

            {/* FastAPI Troubleshooting Guide */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-white/5 text-left text-xs space-y-2">
              <div className="flex items-center gap-1.5 text-slate-300 font-semibold text-[11px] uppercase tracking-wider">
                <Server className="w-3.5 h-3.5 text-blue-400" />
                <span>FastAPI Host Configuration</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Target: <span className="text-cyan-300 font-mono">{FASTAPI_BACKEND_URL}</span>
              </p>
              <p className="text-slate-400 text-[11px]">
                Ensure your FastAPI endpoint accepts{" "}
                <code className="text-slate-200">POST /api/auth/google</code> with{" "}
                <code className="text-slate-200">{`{ code, redirect_uri }`}</code>.
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={() => navigate({ to: "/login" })}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors cursor-pointer"
              >
                <span>Return to Login</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleBypassToDemo}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold text-cyan-300 bg-cyan-950/40 border border-cyan-500/30 hover:bg-cyan-900/40 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Bypass into Demo Workspace</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
