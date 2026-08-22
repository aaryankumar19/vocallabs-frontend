import React from "react";
import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";

export default function Login() {
  return (
    <div className="min-h-screen bg-[#050816] flex items-center justify-center relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="fixed top-[-200px] left-[-200px] w-[700px] h-[700px] bg-blue-600/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="fixed bottom-[-200px] right-[-200px] w-[600px] h-[600px] bg-cyan-500/8 rounded-full blur-[160px] pointer-events-none" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-indigo-600/5 rounded-full blur-[200px] pointer-events-none" />

      <GoogleLoginButton />
    </div>
  );
}
