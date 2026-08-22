import React, { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  initiateGoogleOAuthRedirect,
  isGoogleConfigured,
  authenticateWithBackend,
} from "@/lib/auth";
import { Loader2, Sparkles, AlertCircle } from "lucide-react";

export function GoogleLoginButton() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const handleGoogleLogin = () => {
    setError("");
    if (!isGoogleConfigured()) {
      setError("Google Client ID is missing in .env.");
      return;
    }
    setLoading(true);
    try {
      initiateGoogleOAuthRedirect();
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : "Failed to initiate Google authentication.");
    }
  };

  const handleDemoAccess = async () => {
    try {
      setError("");
      setDemoLoading(true);
      await authenticateWithBackend("demo@vocallabs.ai", "Demo Participant");
      navigate({ to: "/dashboard" });
    } catch (err) {
      setError(err.message || "Failed to authenticate with backend");
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col items-center gap-8 px-4">
      {/* Logo + Brand */}
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#0D9488] via-[#0891B2] to-[#0284C7] flex items-center justify-center shadow-lg shadow-[#0D9488]/30 text-white">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-[#0F292B] tracking-tight">VocalLabs</h1>
          <p className="text-sm text-[#115E59] mt-1 font-medium">Autonomous Post-Meeting Intelligence</p>
        </div>
      </div>

      {/* Card */}
      <div className="w-full rounded-3xl border border-[#B7E6DF] bg-[#F3FFFE]/95 backdrop-blur-2xl shadow-xl shadow-[#0D9488]/5 p-8 flex flex-col gap-6">
        <div className="text-center">
          <h2 className="text-lg font-bold text-[#0F292B]">Sign in to continue</h2>
          <p className="text-xs text-[#115E59] mt-1">Access your workspace meetings and follow-throughs.</p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-[#F9EAF0] border border-[#B7E6DF] text-[#9D174D] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#BE185D]" />
            <span>{error}</span>
          </div>
        )}

        {/* Native Official Google Sign-In Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading || demoLoading}
          className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-2xl bg-white hover:bg-[#D1F2EE]/30 active:scale-[0.98] text-[#0F292B] font-semibold text-sm border border-[#B7E6DF] shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin text-[#0D9488]" />
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>{loading ? "Redirecting to Google..." : "Sign in with Google"}</span>
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 border-t border-[#B7E6DF]" />
          <span className="text-[10px] uppercase tracking-widest text-[#115E59] font-semibold">or</span>
          <div className="flex-1 border-t border-[#B7E6DF]" />
        </div>

        {/* Demo Account Access with real FastAPI token */}
        <button
          type="button"
          onClick={handleDemoAccess}
          disabled={loading || demoLoading}
          className="w-full py-3 px-4 rounded-2xl text-xs font-semibold text-[#0F766E] border border-[#B7E6DF] bg-[#D1F2EE] hover:bg-[#B7E6DF] active:scale-[0.99] transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 shadow-2xs"
        >
          {demoLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0D9488]" />
          ) : (
            <Sparkles className="w-3.5 h-3.5 text-[#0D9488]" />
          )}
          <span>{demoLoading ? "Authenticating with Backend..." : "Continue with Fast Demo Access"}</span>
        </button>
      </div>

      <p className="text-[11px] text-[#115E59] text-center font-medium">
        Powered by VocalLabs AI &amp; FastAPI Backend Engine.
      </p>
    </div>
  );
}
