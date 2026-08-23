"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Bell, BellOff, CheckCheck, Menu, Moon, Search, Sun, Monitor, Plus } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { useUI } from "@/stores/ui";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Notification } from "@/types";

const PAGE_TITLES: Record<string, string> = {
  dashboard: "Dashboard",
  agents: "Agents",
  "agents/new": "Create Agent",
  playground: "Playground",
  marketplace: "Marketplace",
  workflows: "Workflows",
  "multi-agent": "Multi-Agent",
  schedules: "Schedules",
  runs: "Agent Runs",
  approvals: "Approvals",
  knowledge: "Knowledge",
  memory: "Memory",
  tools: "Tool Library",
  observability: "Observability",
  analytics: "Analytics",
  evaluations: "Evaluations",
  versions: "Versions",
  documents: "Documents",
  integrations: "Integrations",
  projects: "Projects",
  conversations: "Conversations",
  chat: "Assistant",
  assistant: "Assistant",
  search: "Search",
  settings: "Settings",
  logs: "Logs",
};

export function TopHeader({ title }: { title?: string }) {
  const pathname = usePathname();
  const segment = pathname.split("/").filter(Boolean)[0] ?? "";
  const fallbackTitle = PAGE_TITLES[segment] ?? "NexaAgent";
  const { setMobileSidebarOpen, setCommandPaletteOpen } = useUI();
  const { theme, setTheme } = useTheme();
  const qc = useQueryClient();

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: () => api.get("/api/notifications"),
    refetchInterval: 15000,
  });
  const unread = notifications.filter((n) => !n.read).length;

  async function markRead(id: number) {
    await api.post(`/api/notifications/${id}/read`);
    qc.invalidateQueries({ queryKey: ["notifications"] });
  }

  async function markAll() {
    await api.post("/api/notifications/read-all");
    qc.invalidateQueries({ queryKey: ["notifications"] });
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileSidebarOpen(true)} aria-label="Open sidebar">
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex-1 truncate text-sm font-medium text-muted-foreground">
        {title ?? fallbackTitle}
        {pathname.startsWith("/agents/") && <span className="ml-2 text-xs text-muted-foreground/60">· Agent detail</span>}
        {pathname.startsWith("/runs/") && <span className="ml-2 text-xs text-muted-foreground/60">· Execution detail</span>}
      </div>

      <Link
        href="/agents/new"
        className="hidden h-8 items-center gap-1.5 rounded-md bg-gradient-to-r from-violet-600 to-indigo-600 px-3 text-xs font-medium text-white shadow-md shadow-violet-600/20 transition-opacity hover:opacity-90 md:inline-flex"
      >
        <Plus className="h-3.5 w-3.5" /> New Agent
      </Link>

      <Button variant="outline" size="sm" className="hidden sm:flex gap-2 text-muted-foreground" onClick={() => setCommandPaletteOpen(true)}>
        <Search className="h-4 w-4" />
        <span>Search…</span>
        <kbd className="pointer-events-none ml-1 rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium">⌘K</kbd>
      </Button>
      <Button variant="ghost" size="icon" className="sm:hidden" onClick={() => setCommandPaletteOpen(true)} aria-label="Command palette">
        <Search className="h-5 w-5" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
            {notifications.length === 0 ? <BellOff className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
            {unread > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <div className="flex items-center justify-between px-2 py-1.5">
            <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
            {unread > 0 && (
              <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={markAll}>
                <CheckCheck className="h-3.5 w-3.5 mr-1" /> Mark all read
              </Button>
            )}
          </div>
          <DropdownMenuSeparator />
          <div className="max-h-80 overflow-auto">
            {notifications.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">No notifications yet.</div>
            ) : (
              notifications.slice(0, 20).map((n) => (
                <DropdownMenuItem
                  key={n.id}
                  className="flex cursor-pointer items-start gap-2 py-2"
                  onClick={() => markRead(n.id)}
                >
                  <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${n.read ? "bg-muted-foreground/30" : "bg-primary"}`} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{n.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">{n.body}</span>
                  </span>
                </DropdownMenuItem>
              ))
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Theme">
            {theme === "dark" ? <Moon className="h-5 w-5" /> : theme === "light" ? <Sun className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Appearance</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setTheme("light")}>
            <Sun /> Light
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("dark")}>
            <Moon /> Dark
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("system")}>
            <Monitor /> System
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}