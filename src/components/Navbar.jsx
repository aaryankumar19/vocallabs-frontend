import { Link, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";

export default function Navbar() {
  const routerState = useRouterState();
  const pathname = routerState?.location?.pathname || "";

  // The application provides full-screen layouts for login, signup, and dashboard
  if (
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/dashboard" ||
    pathname.startsWith("/_authenticated") ||
    pathname === "/"
  ) {
    return null;
  }

  return null;
}
