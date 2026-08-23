"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Bot,
  Play,
  CheckCircle2,
  Gauge,
  Coins,
  DollarSign,
  Wrench,
  MessagesSquare,
  ArrowRight,
  Loader2,
  ShieldAlert,
  TrendingUp,
  Clock,
  AlertTriangle,
  Sparkles,
  Plus,
} from "lucide-react";
import { api } from "@/lib/api";
import { MetricCard } from "@/components/shared/MetricCard";
import { StatusPill } from "@/components/shared/StatusPill";
import { ActivityChart } from "@/components/dashboard/ActivityChart";
import { SuccessRing } from "@/components/dashboard/SuccessRing";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCost, formatDate, formatTokens } from "@/lib/format";
import type { DashboardStats, Approval } from "@/types";

const statusVariant: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
  completed: "success",
  running: "warning",
  pending: "secondary",
  failed: "destructive",
};

export default function DashboardPage() {
  const { data, isLoading, isError, refetch } = useQuery<DashboardStats>({
    queryKey: ["dashboard", "stats"],
    queryFn: () => api.get("/api/dashboard/stats"),
  });
  const { data: pendingApprovals = [] } = useQuery<Approval[]>({
    queryKey: ["approvals", "pending"],
    queryFn: () => api.get("/api/approvals/pending"),
    refetchInterval: 15000,
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const liveActivity = useMemo(() => (data?.recent_runs ?? []).slice(0, 5), [data]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {greeting} <span aria-hidden>👋</span>
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Your AI workspace</h1>
            <p className="mt-1 text-sm text-muted-foreground">Live overview of your agents, runs and costs.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/agents/new">
              <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 shadow-md shadow-violet-600/20">
                <Plus className="h-4 w-4" /> New Agent
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      {isError && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load dashboard stats.{" "}
          <button className="underline" onClick={() => refetch()}>
            Retry
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Active Agents" value={data ? String(data.active_agents) : "—"} icon={Bot} loading={isLoading} accent="bg-violet-500/10 text-violet-600" hint="Deployed & ready" />
        <MetricCard label="Running Jobs" value={data ? String(data.running_tasks) : "—"} icon={Play} loading={isLoading} accent="bg-amber-500/10 text-amber-600" hint="Executing now" />
        <MetricCard label="Success Rate" value={data ? `${data.success_rate}%` : "—"} icon={Gauge} loading={isLoading} accent="bg-emerald-500/10 text-emerald-600" hint="Last 30 days" trend={{ dir: "up", text: "2.1% vs last week" }} />
        <MetricCard label="AI Cost" value={data ? formatCost(data.estimated_cost) : "—"} icon={DollarSign} loading={isLoading} accent="bg-indigo-500/10 text-indigo-600" hint="This month" trend={{ dir: "up", text: "Budget on track" }} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Live activity */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Live Agent Activity</CardTitle>
              <CardDescription>Real-time runs across your workspace</CardDescription>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Live
            </span>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : liveActivity.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <Bot className="h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No runs yet. Give your first agent a goal to see live activity.</p>
                <Link href="/chat" className="text-sm font-medium text-primary hover:underline">
                  Start your first run →
                </Link>
              </div>
            ) : (
              <div className="divide-y">
                {liveActivity.map((run, i) => (
                  <motion.div
                    key={run.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06, duration: 0.3 }}
                  >
                    <Link href={`/runs/${run.id}`} className="flex items-center justify-between gap-4 py-3 transition-colors hover:bg-muted/40">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                          {run.status === "running" ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : run.status === "completed" ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-rose-500" />
                          )}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{run.input || "Untitled run"}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(run.created_at)} · {formatTokens(run.tokens)} tokens · {formatCost(run.cost)}
                          </p>
                        </div>
                      </div>
                      <StatusPill status={run.status} />
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right column */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Execution Health</CardTitle>
              <CardDescription>Agent run success rate</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center gap-4">
              {isLoading ? (
                <Skeleton className="h-[120px] w-[120px] rounded-full" />
              ) : (
                <SuccessRing value={data?.success_rate ?? 0} />
              )}
              <div className="grid w-full grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-lg bg-muted p-2">
                  <div className="text-base font-semibold">{data?.total_executions ?? 0}</div>
                  <div className="text-muted-foreground">Total</div>
                </div>
                <div className="rounded-lg bg-muted p-2">
                  <div className="text-base font-semibold">{data?.completed_tasks ?? 0}</div>
                  <div className="text-muted-foreground">Succeeded</div>
                </div>
                <div className="rounded-lg bg-muted p-2">
                  <div className="text-base font-semibold">{(data?.recent_runs ?? []).filter((r) => r.status === "failed").length}</div>
                  <div className="text-muted-foreground">Failed</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pending Approvals</CardTitle>
              <CardDescription>Actions waiting on you</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingApprovals.length === 0 ? (
                <div className="flex items-center gap-3 py-4 text-sm text-muted-foreground">
                  <ShieldAlert className="h-5 w-5 text-muted-foreground/50" />
                  You&apos;re all caught up.
                </div>
              ) : (
                <div className="space-y-2">
                  {pendingApprovals.slice(0, 4).map((a) => (
                    <Link key={a.id} href="/approvals" className="flex items-center gap-3 rounded-lg border p-2.5 transition-colors hover:bg-muted/40">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                        <Clock className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{a.reason || a.tool_id}</p>
                        <p className="truncate text-xs text-muted-foreground">Run {a.run_id.slice(0, 8)}</p>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Daily Activity</CardTitle>
            <CardDescription>Messages sent over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-48 w-full" /> : <ActivityChart data={data?.activity ?? []} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cost Summary</CardTitle>
            <CardDescription>Estimated spend this month</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Token usage", value: data ? formatTokens(data.token_usage) : "—", icon: Coins },
              { label: "Tool calls", value: data ? String(data.tool_calls) : "—", icon: Wrench },
              { label: "Conversations", value: data ? String(data.conversations) : "—", icon: MessagesSquare },
            ].map((row) => (
              <div key={row.label} className="flex items-center gap-3 rounded-lg border p-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <row.icon className="h-4 w-4" />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{row.label}</p>
                  <p className="text-xs text-muted-foreground">{row.value}</p>
                </div>
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}