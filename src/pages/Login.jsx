import React from "react";
import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";

export default function Login() {
  return (
    <div className="min-h-screen bg-[#F3FFFE] flex items-center justify-center relative overflow-hidden">
      {/* Breezy coastal background glows */}
      <div className="fixed top-[-200px] left-[-200px] w-[700px] h-[700px] bg-[#D1F2EE]/70 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-[-200px] right-[-200px] w-[600px] h-[600px] bg-[#E6F2FF]/80 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#F9EAF0]/50 rounded-full blur-[180px] pointer-events-none" />

      <GoogleLoginButton />
    </div>
  );
}
