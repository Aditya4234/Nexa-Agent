"use client";

import { useQuery } from "@tanstack/react-query";
import { Activity, BarChart3, CircleDollarSign, Cpu, Gauge, ThumbsDown, ThumbsUp, Timer, Wrench } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { MetricCard } from "@/components/shared/MetricCard";
import { formatCost, formatNumber } from "@/lib/format";
import type { AnalyticsData } from "@/types";

const STATUS_COLORS: Record<string, string> = {
  completed: "hsl(var(--primary))",
  failed: "hsl(var(--destructive))",
  running: "hsl(var(--warning, 38 92% 50%))",
  pending: "hsl(var(--muted-foreground))",
};

const TOOL_COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--destructive))", "#f59e0b", "#10b981", "#8b5cf6"];

export default function AnalyticsPage() {
  const { data, isLoading, isError, refetch } = useQuery<AnalyticsData>({
    queryKey: ["analytics"],
    queryFn: () => api.get("/api/analytics"),
  });

  if (isError) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
        <PageHeader eyebrow="Observability" title="Analytics" />
        <div className="flex items-center justify-between rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          Failed to load analytics.
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
        <PageHeader eyebrow="Observability" title="Analytics" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const stats = [
    { label: "Total runs", value: formatNumber(data.total_runs), icon: Activity, accent: "bg-violet-500/10 text-violet-600" },
    { label: "Success rate", value: `${data.success_rate}%`, icon: Gauge, accent: "bg-emerald-500/10 text-emerald-600" },
    { label: "Avg latency", value: `${Math.round(data.avg_latency_ms / 1000)}s`, icon: Timer, accent: "bg-amber-500/10 text-amber-600" },
    { label: "Tool calls", value: formatNumber(data.tool_calls), icon: Wrench, accent: "bg-indigo-500/10 text-indigo-600" },
    { label: "Tokens used", value: formatNumber(data.total_tokens), icon: Cpu, accent: "bg-sky-500/10 text-sky-600" },
    { label: "Est. cost", value: formatCost(data.total_cost), icon: CircleDollarSign, accent: "bg-emerald-500/10 text-emerald-600" },
    { label: "Thumbs up", value: String(data.feedback.up), icon: ThumbsUp, accent: "bg-teal-500/10 text-teal-600" },
    { label: "Thumbs down", value: String(data.feedback.down), icon: ThumbsDown, accent: "bg-rose-500/10 text-rose-600" },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <PageHeader
        eyebrow="Observability"
        title="Analytics"
        description="Usage, performance and quality metrics across your agents."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon, accent }) => (
          <MetricCard key={label} label={label} value={value} icon={icon} accent={accent} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Runs per day</CardTitle>
            <CardDescription>Last 14 days</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v: string) => v.slice(5)} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={30} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="runs" name="Runs" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="tokens" name="Tokens" stroke="#f59e0b" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Run outcomes</CardTitle>
            <CardDescription>Completed vs failed</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v: string) => v.slice(5)} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={30} />
                <Tooltip />
                <Legend />
                <Bar dataKey="completed" name="Completed" stackId="a" fill="hsl(var(--primary))" />
                <Bar dataKey="failed" name="Failed" stackId="a" fill="hsl(var(--destructive))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tool usage</CardTitle>
            <CardDescription>Most-used tools</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {data.tool_usage.length === 0 ? (
              <p className="flex h-full items-center justify-center text-sm text-muted-foreground">No tool calls yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.tool_usage}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="tool_id" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={30} />
                  <Tooltip />
                  <Bar dataKey="count" name="Calls">
                    {data.tool_usage.map((_, i) => (
                      <Cell key={i} fill={TOOL_COLORS[i % TOOL_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Model distribution</CardTitle>
            <CardDescription>Runs by model</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {data.model_distribution.length === 0 ? (
              <p className="flex h-full items-center justify-center text-sm text-muted-foreground">No runs yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.model_distribution} dataKey="count" nameKey="model" innerRadius={50} outerRadius={90} label={(p: any) => p.model}>
                    {data.model_distribution.map((_, i) => (
                      <Cell key={i} fill={TOOL_COLORS[i % TOOL_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4" /> Status breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-4">
            {data.status_distribution.map((s) => (
              <div key={s.status} className="flex items-center justify-between rounded-lg border p-3">
                <span className="flex items-center gap-2 text-sm capitalize">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: STATUS_COLORS[s.status] || "hsl(var(--muted-foreground))" }} />
                  {s.status}
                </span>
                <span className="font-semibold">{s.count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}