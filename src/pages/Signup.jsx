import React from "react";
import { AuthVisual } from "@/components/auth/AuthVisual";
import { SignupForm } from "@/components/auth/SignupForm";

export default function Signup() {
  return (
    <div className="min-h-screen bg-[#050816] text-[#F8FAFC] flex overflow-hidden relative selection:bg-cyan-500/30 selection:text-white">
      {/* Background glow effects */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full grid grid-cols-1 lg:grid-cols-12 min-h-screen z-10">
        {/* Left Side: Product Identity & Animated Benefits Visualization */}
        <div className="lg:col-span-7 bg-gradient-to-br from-slate-950/80 via-[#070D1E]/90 to-slate-900/60 border-r border-white/5 flex flex-col">
          <AuthVisual mode="signup" />
        </div>

        {/* Right Side: Glass Signup Card */}
        <div className="lg:col-span-5 flex items-center justify-center p-6 sm:p-10 bg-slate-950/30">
          <SignupForm />
        </div>
      </div>
    </div>
  );
}
