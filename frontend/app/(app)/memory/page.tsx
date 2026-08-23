"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Brain, Search, Trash2, Plus, Clock, Database, Heart, Map, BookOpen, Filter, Download } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { MetricCard } from "@/components/shared/MetricCard";
import { StatusPill } from "@/components/shared/StatusPill";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MemoryEntry {
  id: string;
  type: "semantic" | "episodic" | "preference" | "long-term";
  content: string;
  source: string;
  importance: number;
  timestamp: string;
  tags: string[];
}

const SAMPLE: MemoryEntry[] = [
  { id: "m1", type: "semantic", content: "The user's company targets mid-market SaaS firms in North America.", source: "Conversation #128", importance: 92, timestamp: "2h ago", tags: ["company", "market"] },
  { id: "m2", type: "episodic", content: "Completed pricing analysis for 12 competitors on Aug 18.", source: "Run 6f9a12", importance: 78, timestamp: "1d ago", tags: ["analysis", "competitors"] },
  { id: "m3", type: "preference", content: "Prefers concise bullet-point summaries over long paragraphs.", source: "Feedback signal", importance: 85, timestamp: "3d ago", tags: ["preference"] },
  { id: "m4", type: "long-term", content: "Primary goal Q4: automate weekly competitor intelligence reports.", source: "Agent goal", importance: 97, timestamp: "5d ago", tags: ["goal", "automation"] },
  { id: "m5", type: "semantic", content: "Tech stack: Python, FastAPI, PostgreSQL, Qdrant for vector search.", source: "Knowledge base", importance: 88, timestamp: "1w ago", tags: ["stack", "infra"] },
];

const TYPE_META = {
  "long-term": { label: "Long-Term", icon: BookOpen, cls: "bg-violet-500/10 text-violet-600" },
  semantic: { label: "Semantic", icon: Database, cls: "bg-indigo-500/10 text-indigo-600" },
  episodic: { label: "Episodic", icon: Clock, cls: "bg-amber-500/10 text-amber-600" },
  preference: { label: "Preferences", icon: Heart, cls: "bg-rose-500/10 text-rose-600" },
} as const;

const counts = {
  total: "12,482",
  semantic: "8,921",
  episodic: "2,104",
  preference: "1,457",
};

export default function MemoryPage() {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [entries, setEntries] = useState<MemoryEntry[]>(SAMPLE);

  const filtered = entries.filter(
    (e) =>
      (typeFilter === "all" || e.type === typeFilter) &&
      (query.trim() === "" || e.content.toLowerCase().includes(query.toLowerCase()) || e.tags.some((t) => t.includes(query.toLowerCase())))
  );

  const remove = (id: string) => setEntries((prev) => prev.filter((e) => e.id !== id));

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <PageHeader
        eyebrow="Agent Memory"
        title="Memory"
        description="Short-term context, long-term knowledge and learned preferences your agents remember."
        actions={
          <>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4" /> Export
            </Button>
            <Button size="sm" className="bg-gradient-to-r from-violet-600 to-indigo-600 shadow-md shadow-violet-600/20">
              <Plus className="h-4 w-4" /> Add memory
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Total Memories" value={counts.total} icon={Brain} accent="bg-violet-500/10 text-violet-600" hint="Across all agents" />
        <MetricCard label="Semantic" value={counts.semantic} icon={Database} accent="bg-indigo-500/10 text-indigo-600" hint="Facts & knowledge" />
        <MetricCard label="Episodic" value={counts.episodic} icon={Clock} accent="bg-amber-500/10 text-amber-600" hint="Past interactions" />
        <MetricCard label="Preferences" value={counts.preference} icon={Heart} accent="bg-rose-500/10 text-rose-600" hint="User preferences" />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-base">Memory Store</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search memories…"
                  className="h-9 w-56 pl-8 text-sm"
                />
              </div>
              <div className="flex gap-1">
                {(["all", "long-term", "semantic", "episodic", "preference"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                      typeFilter === t ? "bg-violet-600 text-white" : "bg-muted text-muted-foreground hover:bg-muted/70"
                    )}
                  >
                    {t === "all" ? "All" : t.replace("-", " ")}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <EmptyState icon={Search} title="No memories found" description="Try a different search or filter." />
          ) : (
            <div className="divide-y">
              {filtered.map((m, i) => {
                const meta = TYPE_META[m.type];
                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.3 }}
                    className="flex flex-wrap items-start gap-3 py-3.5"
                  >
                    <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", meta.cls)}>
                      <meta.icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-foreground">{m.content}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <StatusPill status={meta.label} className="border-transparent" />
                        <span className="inline-flex items-center gap-1">
                          <Map className="h-3 w-3" /> {m.source}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {m.timestamp}
                        </span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {m.tags.map((tag) => (
                          <span key={tag} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600">
                        importance {m.importance}
                      </span>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => remove(m.id)} aria-label="Delete memory">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Memory Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { icon: BookOpen, title: "Long-term memory", desc: "Persist facts and knowledge across sessions", enabled: true },
            { icon: Clock, title: "Episodic memory", desc: "Recall past interactions and runs", enabled: true },
            { icon: Database, title: "Semantic memory", desc: "Embed and retrieve related concepts", enabled: true },
            { icon: Heart, title: "User preferences", desc: "Learn and apply user preferences automatically", enabled: false },
          ].map((item) => (
            <div key={item.title} className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <item.icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
              <Button size="sm" variant={item.enabled ? "outline" : "secondary"}>
                {item.enabled ? "Enabled" : "Enable"}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}