import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getAuthSession } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    // Check FastAPI / Google OAuth session
    const session = getAuthSession();
    if (!session?.token) {
      throw redirect({ to: "/login" });
    }
    return { user: session.user };
  },
  component: () => <Outlet />,
});
