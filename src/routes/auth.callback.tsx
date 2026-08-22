import { createFileRoute } from "@tanstack/react-router";
import AuthCallback from "@/pages/AuthCallback";

export const Route = createFileRoute("/auth/callback")({
  head: () => ({
    meta: [
      { title: "Authenticating with Google..." },
      { name: "description", content: "Processing Google authentication." },
    ],
  }),
  component: AuthCallback,
});
