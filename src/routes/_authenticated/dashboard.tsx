import { createFileRoute } from "@tanstack/react-router";
import Dashboard from "@/pages/Dashboard";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard" },
      { name: "description", content: "Your dashboard." },
      { property: "og:title", content: "Dashboard" },
      { property: "og:description", content: "Your dashboard." },
    ],
  }),
  component: Dashboard,
});
