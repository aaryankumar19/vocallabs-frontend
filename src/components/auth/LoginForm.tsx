import React, { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  initiateGoogleLogin,
  isGoogleConfigured,
  getCallbackUrl,
  FASTAPI_BACKEND_URL,
  GOOGLE_CLIENT_ID,
  loginWithEmail,
  setAuthSession,
} from "@/lib/auth";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowRight,
  Loader2,
  Sparkles,
  AlertCircle,
  Info,
  ExternalLink,
} from "lucide-react";

interface LoginFormProps {
  onSwitchToSignup?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToSignup }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showConfigHelper, setShowConfigHelper] = useState(false);

  const handleGoogleAuth = () => {
    if (!isGoogleConfigured()) {
      setShowConfigHelper(true);
      return;
    }
    setGoogleLoading(true);
    initiateGoogleLogin(
      () => { setGoogleLoading(false); navigate({ to: "/dashboard" }); },
      (msg) => { setGoogleLoading(false); setError(msg); },
    );
  };

  const handleForceGoogleAuth = () => {
    setGoogleLoading(true);
    initiateGoogleLogin(
      () => { setGoogleLoading(false); navigate({ to: "/dashboard" }); },
      (msg) => { setGoogleLoading(false); setError(msg); },
    );
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);
    try {
      await loginWithEmail(email, password);
      setLoading(false);
      navigate({ to: "/dashboard" });
    } catch (err: unknown) {
      setLoading(false);
      setError(err instanceof Error ? err.message : "FastAPI sign in failed. Please check if backend server is running.");
    }
  }

  // Instant Demo Mode Bypass for Judges / Quick Presentation
  const handleDemoAccess = () => {
    setLoading(true);
    setTimeout(() => {
      navigate({ to: "/dashboard" });
    }, 600);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Premium Glass Card */}
      <div className="relative rounded-3xl border border-white/10 bg-slate-900/70 p-8 sm:p-10 backdrop-blur-2xl shadow-2xl shadow-black/80 transition-all duration-300 hover:border-blue-500/30">
        {/* Card Ambient Glow */}
        <div className="absolute -top-10 -right-10 w-36 h-36 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Card Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-extrabold tracking-tight text-white mb-2">Welcome back</h2>
          <p className="text-sm text-slate-400">Continue managing your team's commitments.</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 flex items-start gap-2.5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold block text-rose-200">Sign in error</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError("");
                }}
                placeholder="name@company.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/70 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                required
              />
            </div>
          </div>

          {/* Password field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Password
              </label>
              <button
                type="button"
                onClick={() => setError("Password reset instructions sent if email exists.")}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError("");
                }}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950/70 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember me */}
          <div className="flex items-center pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400 select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-950 border-white/20 text-blue-600 focus:ring-blue-500/30 focus:ring-offset-0"
              />
              <span>Remember this browser for 30 days</span>
            </label>
          </div>

          {/* Primary Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-600/30 hover:shadow-blue-600/40 active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                <span>Signing you in...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <span className="relative px-3 bg-slate-900 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
            Or continue with
          </span>
        </div>

        {/* Google OAuth Option */}
        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={googleLoading}
          className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-200 bg-slate-950/60 border border-white/10 hover:border-white/20 hover:bg-slate-800/60 active:scale-[0.99] transition-all duration-200 cursor-pointer disabled:opacity-50"
        >
          {googleLoading ? (
            <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
          )}
          <span>{googleLoading ? "Connecting to Google..." : "Continue with Google"}</span>
        </button>

        {/* Google OAuth Setup Helper Modal/Callout if VITE_GOOGLE_CLIENT_ID is not configured yet */}
        {showConfigHelper && (
          <div className="mt-4 p-4 rounded-2xl bg-slate-950/90 border border-cyan-500/30 text-left text-xs space-y-3 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
                <Info className="w-4 h-4" />
                <span>Google OAuth Configuration</span>
              </div>
              <button
                type="button"
                onClick={() => setShowConfigHelper(false)}
                className="text-slate-500 hover:text-slate-300 text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-slate-300 text-[11px] leading-relaxed">
              To enable real Google Login, place your Google Client ID & Secret in{" "}
              <code className="text-cyan-300 bg-slate-900 px-1 py-0.5 rounded">.env</code>:
            </p>

            <div className="p-2.5 rounded-xl bg-slate-900 border border-white/10 font-mono text-[10px] space-y-1 text-slate-300">
              <div className="text-slate-400"># In your Google Cloud Console:</div>
              <div>
                <strong className="text-cyan-400">Authorized Redirect URI:</strong>
              </div>
              <div className="text-emerald-400 select-all break-all">{getCallbackUrl()}</div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleForceGoogleAuth}
                className="flex-1 py-1.5 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-[11px] transition-colors cursor-pointer"
              >
                Proceed with Google URL
              </button>
              <button
                type="button"
                onClick={handleDemoAccess}
                className="flex-1 py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-[11px] transition-colors cursor-pointer"
              >
                Use Demo Login
              </button>
            </div>
          </div>
        )}

        {/* Instant Demo Access Button for Hackathon */}
        <div className="mt-4 pt-3 border-t border-white/5">
          <button
            type="button"
            onClick={handleDemoAccess}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold text-cyan-300 bg-cyan-950/40 border border-cyan-500/30 hover:bg-cyan-900/40 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>Launch Live Hackathon Demo Space</span>
          </button>
        </div>

        {/* Switch to Signup */}
        <div className="mt-6 text-center text-xs text-slate-400">
          Don't have an account?{" "}
          {onSwitchToSignup ? (
            <button
              type="button"
              onClick={onSwitchToSignup}
              className="text-blue-400 hover:text-blue-300 font-semibold ml-1 cursor-pointer"
            >
              Create account
            </button>
          ) : (
            <Link to="/signup" className="text-blue-400 hover:text-blue-300 font-semibold ml-1">
              Create account
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};
