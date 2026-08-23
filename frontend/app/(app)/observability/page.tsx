"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { motion } from "framer-motion";
import { Activity, Loader2, Wrench, Coins, Clock, ArrowRight, Eye, Bot } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { MetricCard } from "@/components/shared/MetricCard";
import { StatusPill } from "@/components/shared/StatusPill";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCost, formatDate, formatTokens } from "@/lib/format";
import type { AgentRun } from "@/types";

export default function ObservabilityPage() {
  const { data: runs, isLoading } = useQuery<AgentRun[]>({ queryKey: ["runs"], queryFn: () => api.get("/api/runs"), refetchInterval: 10000 });

  const running = (runs ?? []).filter((r) => r.status === "running");
  const recent = (runs ?? []).slice(0, 6);
  const totals = (runs ?? []).reduce(
    (acc, r) => ({ tokens: acc.tokens + (r.tokens || 0), cost: acc.cost + (r.cost || 0), tools: acc.tools + (r.tools_used?.length || 0), duration: acc.duration + (r.duration_ms || 0) }),
    { tokens: 0, cost: 0, tools: 0, duration: 0 }
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <PageHeader
        eyebrow="Agent Observability"
        title="Live Runs"
        description="Watch agent planning, tool calls and progress as they execute — with full traceability."
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            {running.length} running now
          </span>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Live Executions" value={String(running.length)} icon={Activity} accent="bg-emerald-500/10 text-emerald-600" />
        <MetricCard label="Total Tokens" value={formatTokens(totals.tokens)} icon={Coins} accent="bg-violet-500/10 text-violet-600" />
        <MetricCard label="Total Cost" value={formatCost(totals.cost)} icon={Coins} accent="bg-indigo-500/10 text-indigo-600" />
        <MetricCard label="Tool Calls" value={String(totals.tools)} icon={Wrench} accent="bg-amber-500/10 text-amber-600" />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Eye className="h-4 w-4" /> Execution Feed
            </CardTitle>
            <Link href="/runs" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <Bot className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No executions yet. Run an agent to see live traces.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recent.map((run, i) => (
                <motion.div
                  key={run.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                >
                  <Link href={`/runs/${run.id}`} className="flex items-center justify-between gap-4 rounded-lg border p-3.5 transition-colors hover:bg-muted/40">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                        {run.status === "running" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Activity className="h-4 w-4" />}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{run.input || "Untitled run"}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {formatDate(run.created_at)} · {run.model || "auto"} · {formatTokens(run.tokens)} tokens · {formatCost(run.cost)} · {run.tools_used.length} tool calls
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="hidden items-center gap-1 text-xs text-muted-foreground sm:flex">
                        <Clock className="h-3 w-3" /> {Math.round((run.duration_ms || 0) / 1000)}s
                      </span>
                      <StatusPill status={run.status} />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}