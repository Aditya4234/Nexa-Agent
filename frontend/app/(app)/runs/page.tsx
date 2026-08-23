"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Play, Loader2, Gauge, DollarSign, Wrench, Clock, Activity } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/PageHeader";
import { MetricCard } from "@/components/shared/MetricCard";
import { StatusPill } from "@/components/shared/StatusPill";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatCost, formatDate, formatTokens, formatDuration } from "@/lib/format";
import type { AgentRun } from "@/types";

const FILTERS = ["all", "completed", "running", "failed"] as const;

export default function RunsPage() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const { data, isLoading, isError, refetch } = useQuery<AgentRun[]>({ queryKey: ["runs"], queryFn: () => api.get("/api/runs") });

  const filtered = useMemo(() => (data ?? []).filter((r) => filter === "all" || r.status === filter), [data, filter]);

  const totals = useMemo(() => {
    const list = data ?? [];
    return {
      total: list.length,
      cost: list.reduce((s, r) => s + (r.cost || 0), 0),
      tools: list.reduce((s, r) => s + (r.tools_used?.length || 0), 0),
      duration: list.reduce((s, r) => s + (r.duration_ms || 0), 0),
      tokens: list.reduce((s, r) => s + (r.tokens || 0), 0),
    };
  }, [data]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <PageHeader
        eyebrow="Execution History"
        title="Agent Runs"
        description="Every execution across all agents — replayable and fully traceable."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Total Runs" value={isLoading ? "—" : String(totals.total)} icon={Activity} accent="bg-violet-500/10 text-violet-600" />
        <MetricCard label="Total Tokens" value={isLoading ? "—" : formatTokens(totals.tokens)} icon={Gauge} accent="bg-indigo-500/10 text-indigo-600" />
        <MetricCard label="Total Cost" value={isLoading ? "—" : formatCost(totals.cost)} icon={DollarSign} accent="bg-emerald-500/10 text-emerald-600" />
        <MetricCard label="Avg Duration" value={isLoading ? "—" : totals.total ? formatDuration(Math.round(totals.duration / totals.total)) : "—"} icon={Clock} accent="bg-amber-500/10 text-amber-600" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs defaultValue="all" onValueChange={(v) => setFilter(v as (typeof FILTERS)[number])}>
          <TabsList>
            {FILTERS.map((f) => (
              <TabsTrigger key={f} value={f} className="capitalize">
                {f}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <span className="text-xs text-muted-foreground">
          {filtered.length} of {totals.total} runs
        </span>
      </div>

      {isError && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load runs.{" "}
          <button className="underline" onClick={() => refetch()}>
            Retry
          </button>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Play}
              title="No runs here yet"
              description="Run an agent or workflow and it will show up in your execution history."
              action={
                <Link href="/chat">
                  <span className="text-sm font-medium text-primary hover:underline">Start your first run →</span>
                </Link>
              }
            />
          ) : (
            <div className="divide-y">
              {filtered.map((r) => (
                <Link key={r.id} href={`/runs/${r.id}`} className="flex items-center justify-between gap-4 px-4 py-3.5 transition-colors hover:bg-muted/40">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                      {r.status === "running" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{r.input || "Untitled run"}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {formatDate(r.created_at)} · {r.model || "auto"} · {formatTokens(r.tokens)} tokens · {formatCost(r.cost)} · {r.tools_used.length} tools
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="hidden items-center gap-1 text-xs text-muted-foreground sm:flex">
                      <Wrench className="h-3 w-3" /> {r.tools_used.length}
                    </span>
                    <StatusPill status={r.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}