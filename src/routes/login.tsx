import { createFileRoute } from "@tanstack/react-router";
import Login from "@/pages/Login";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login" },
      { name: "description", content: "Sign in to your account." },
      { property: "og:title", content: "Login" },
      { property: "og:description", content: "Sign in to your account." },
    ],
  }),
  component: Login,
});
