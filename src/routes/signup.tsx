import { createFileRoute } from "@tanstack/react-router";
import Signup from "@/pages/Signup";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Sign up" },
      { name: "description", content: "Create a new account." },
      { property: "og:title", content: "Sign up" },
      { property: "og:description", content: "Create a new account." },
    ],
  }),
  component: Signup,
});
