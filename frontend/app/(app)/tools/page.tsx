"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Search,
  Globe,
  Database,
  MessageSquare,
  Code2,
  FileText,
  Cloud,
  BarChart3,
  CreditCard,
  Plug,
  Wrench,
  Terminal,
  Bot,
  Check,
  Play,
  Puzzle,
} from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusPill } from "@/components/shared/StatusPill";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Plugin } from "@/types";

const CATEGORIES = [
  { id: "all", label: "All", icon: Plug },
  { id: "web", label: "Web", icon: Globe },
  { id: "database", label: "Database", icon: Database },
  { id: "communication", label: "Communication", icon: MessageSquare },
  { id: "development", label: "Development", icon: Code2 },
  { id: "files", label: "Files", icon: FileText },
  { id: "cloud", label: "Cloud", icon: Cloud },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "search", label: "Search", icon: Search },
] as const;

const ICON_MAP: Record<string, typeof Wrench> = {
  web_search: Globe,
  browser: Globe,
  python: Code2,
  javascript: Code2,
  code_execution: Terminal,
  postgresql: Database,
  mongodb: Database,
  github: Code2,
  slack: MessageSquare,
  email: MessageSquare,
  "google-drive": FileText,
  "web-crawler": Globe,
  rag: Database,
  sql: Database,
  rest_api: Plug,
  mcp: Puzzle,
};

export default function ToolsPage() {
  const qc = useQueryClient();
  const { data: plugins, isLoading } = useQuery<Plugin[]>({ queryKey: ["plugins"], queryFn: () => api.get("/api/plugins") });
  const [category, setCategory] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const list = plugins ?? [];
    return list.filter(
      (p) =>
        (category === "all" || p.category === category) &&
        (query.trim() === "" || p.name.toLowerCase().includes(query.toLowerCase()) || p.description.toLowerCase().includes(query.toLowerCase()))
    );
  }, [plugins, category, query]);

  const toggle = async (p: Plugin) => {
    setBusy(p.id);
    try {
      await api.put(`/api/plugins/${p.id}`, { enabled: !p.enabled });
      qc.invalidateQueries({ queryKey: ["plugins"] });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <PageHeader
        eyebrow="Tooling & Integrations"
        title="Tool Library"
        description="Connect tools, APIs, browsers and MCP servers. Every call is logged, permission-checked and auditable."
      />

      <div className="flex flex-wrap items-center gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              category === c.id ? "bg-violet-600 text-white shadow-md shadow-violet-600/20" : "bg-muted text-muted-foreground hover:bg-muted/70"
            )}
          >
            <c.icon className="h-3.5 w-3.5" />
            {c.label}
          </button>
        ))}
        <div className="relative ml-auto">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tools…" className="h-9 w-56 pl-8 text-sm" />
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Wrench} title="No tools found" description="No tools match your search in this category." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p, i) => {
            const Icon = ICON_MAP[p.id] ?? Plug;
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                className="group flex flex-col rounded-2xl border bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet-900/10"
              >
                <div className="flex items-start justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-50 to-indigo-50 text-violet-600 ring-1 ring-violet-100">
                    <Icon className="h-5 w-5" />
                  </span>
                  <StatusPill status={p.enabled ? "connected" : "disabled"} />
                </div>
                <h3 className="mt-4 font-semibold">{p.name}</h3>
                <p className="mt-1 flex-1 text-sm text-muted-foreground">{p.description}</p>
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {p.category && <Badge variant="outline" className="text-[10px]">{p.category}</Badge>}
                  {p.requires_approval && <Badge variant="warning" className="text-[10px]">approval required</Badge>}
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <Button size="sm" variant={p.enabled ? "outline" : "default"} className={p.enabled ? "" : "bg-gradient-to-r from-violet-600 to-indigo-600 shadow-md shadow-violet-600/20"} onClick={() => toggle(p)} disabled={busy === p.id}>
                    {busy === p.id ? <Bot className="h-3.5 w-3.5 animate-pulse" /> : p.enabled ? <Check className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                    {p.enabled ? "Disable" : "Enable"}
                  </Button>
                  <Button size="sm" variant="ghost">Test connection</Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* MCP section */}
      <div className="rounded-2xl border bg-gradient-to-br from-violet-50/60 via-white to-indigo-50/60 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/25">
              <Puzzle className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-semibold">Model Context Protocol (MCP) Servers</h3>
              <p className="text-sm text-muted-foreground">Connect external MCP servers to extend your agents with any tool the protocol supports.</p>
            </div>
          </div>
          <Button variant="outline">Manage MCP servers</Button>
        </div>
      </div>
    </div>
  );
}