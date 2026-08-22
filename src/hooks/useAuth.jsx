import { useEffect, useState } from "react";
import { getAuthSession, onAuthStateChanged, logout as authLogout } from "@/lib/auth";

export function useAuth() {
  const [session, setSession] = useState(() => getAuthSession());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 1. Initial FastAPI Session
    setSession(getAuthSession());

    // 2. Listen to FastAPI Auth Events
    const unsubscribe = onAuthStateChanged((newSession) => {
      setSession(newSession);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const activeUser = session?.user || null;
  const activeToken = session?.token || null;

  const logout = () => {
    authLogout();
  };

  return {
    session,
    user: activeUser,
    token: activeToken,
    loading,
    logout,
  };
}

export default useAuth;
