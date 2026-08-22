import React, { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  initiateGoogleLogin,
  isGoogleConfigured,
  getCallbackUrl,
  signupWithEmail,
} from "@/lib/auth";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  ArrowRight,
  Loader2,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Info,
} from "lucide-react";

interface SignupFormProps {
  onSwitchToLogin?: () => void;
}

export const SignupForm: React.FC<SignupFormProps> = ({ onSwitchToLogin }) => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
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
      () => {
        setGoogleLoading(false);
        navigate({ to: "/dashboard" });
      },
      (msg) => {
        setGoogleLoading(false);
        setError(msg);
      },
    );
  };

  const handleForceGoogleAuth = () => {
    setGoogleLoading(true);
    initiateGoogleLogin(
      () => {
        setGoogleLoading(false);
        navigate({ to: "/dashboard" });
      },
      (msg) => {
        setGoogleLoading(false);
        setError(msg);
      },
    );
  };

  // Calculate password strength
  const getPasswordStrength = () => {
    if (!password) return { level: 0, text: "None", color: "bg-slate-700" };
    if (password.length < 6) return { level: 1, text: "Weak", color: "bg-rose-500" };
    if (password.length >= 8 && /[0-9]/.test(password) && /[a-zA-Z]/.test(password)) {
      return { level: 3, text: "Strong", color: "bg-emerald-400" };
    }
    return { level: 2, text: "Fair", color: "bg-amber-400" };
  };

  const strength = getPasswordStrength();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await signupWithEmail(email, password, fullName);
      setLoading(false);
      navigate({ to: "/dashboard" });
    } catch (err: unknown) {
      setLoading(false);
      setError(
        err instanceof Error
          ? err.message
          : "FastAPI registration failed. Please check backend server.",
      );
    }
  }

  const handleDemoAccess = () => {
    setLoading(true);
    setTimeout(() => {
      navigate({ to: "/dashboard" });
    }, 600);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Glass Signup Card */}
      <div className="relative rounded-3xl border border-white/10 bg-slate-900/70 p-8 sm:p-10 backdrop-blur-2xl shadow-2xl shadow-black/80 transition-all duration-300 hover:border-blue-500/30">
        {/* Card Ambient Glow */}
        <div className="absolute -top-10 -right-10 w-36 h-36 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Card Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-extrabold tracking-tight text-white mb-2">
            Create your workspace
          </h2>
          <p className="text-sm text-slate-400">Start tracking what happens after the meeting.</p>
        </div>

        {/* Error / Success Notifications */}
        {error && (
          <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <div>
              <span className="font-semibold block text-rose-200">Input alert</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {message && (
          <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
            <div>
              <span className="font-semibold block text-emerald-200">Account created</span>
              <span>{message}</span>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (error) setError("");
                }}
                placeholder="Aaryan Sharma"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/70 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Work Email
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

          {/* Password */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Password
            </label>
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
                placeholder="Create a strong password"
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

            {/* Password strength meter */}
            {password && (
              <div className="pt-1">
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                  <span>
                    Strength: <strong className="text-slate-200">{strength.text}</strong>
                  </span>
                  <span>{strength.level}/3</span>
                </div>
                <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden flex gap-1">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${strength.level >= 1 ? strength.color : "bg-transparent"} flex-1`}
                  />
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${strength.level >= 2 ? strength.color : "bg-transparent"} flex-1`}
                  />
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${strength.level >= 3 ? strength.color : "bg-transparent"} flex-1`}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (error) setError("");
                }}
                placeholder="Repeat your password"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/70 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                required
              />
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-lg shadow-blue-600/30 active:scale-[0.99] transition-all duration-200 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                <span>Creating workspace...</span>
              </>
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-5 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <span className="relative px-3 bg-slate-900 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
            Or sign up with
          </span>
        </div>

        {/* Google OAuth Button */}
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
          <span>{googleLoading ? "Connecting to Google..." : "Sign up with Google"}</span>
        </button>

        {/* Google OAuth Setup Helper Modal/Callout */}
        {showConfigHelper && (
          <div className="mt-4 p-4 rounded-2xl bg-slate-950/90 border border-cyan-500/30 text-left text-xs space-y-3 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
                <Info className="w-4 h-4" />
                <span>Google OAuth Setup</span>
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
              Place your Google OAuth Client ID in{" "}
              <code className="text-cyan-300 bg-slate-900 px-1 py-0.5 rounded">.env</code>:
            </p>

            <div className="p-2.5 rounded-xl bg-slate-900 border border-white/10 font-mono text-[10px] space-y-1 text-slate-300">
              <div className="text-slate-400"># Authorized Redirect URI:</div>
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

        {/* Demo Fast Track */}
        <div className="mt-4 pt-3 border-t border-white/5">
          <button
            type="button"
            onClick={handleDemoAccess}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold text-cyan-300 bg-cyan-950/40 border border-cyan-500/30 hover:bg-cyan-900/40 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>Launch Instant Demo Workspace</span>
          </button>
        </div>

        {/* Switch to Login */}
        <div className="mt-6 text-center text-xs text-slate-400">
          Already have an account?{" "}
          {onSwitchToLogin ? (
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-blue-400 hover:text-blue-300 font-semibold ml-1 cursor-pointer"
            >
              Sign in
            </button>
          ) : (
            <Link to="/login" className="text-blue-400 hover:text-blue-300 font-semibold ml-1">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};
