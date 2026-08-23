"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  CircleDashed,
  Loader2,
  Play,
  XCircle,
  Zap,
  Search,
  BarChart3,
  PenLine,
  ShieldCheck,
  Send,
  GripVertical,
  Plus,
  Clock,
  CalendarClock,
} from "lucide-react";

import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/PageHeader";
import { formatCost, formatNumber } from "@/lib/format";
import { Markdown } from "@/components/chat/Markdown";
import type { Agent, WorkflowRun } from "@/types";

const SPECIALIST_ICON: Record<string, string> = { RESEARCH: "🔎", CODING: "💻", DATA: "📊" };

const builderNodes = [
  { name: "Trigger", icon: Zap, type: "trigger", desc: "Every Monday 09:00" },
  { name: "Research Agent", icon: Search, type: "agent", desc: "Competitors · market" },
  { name: "Web Search", icon: Search, type: "tool", desc: "20 sources" },
  { name: "Data Analyzer", icon: BarChart3, type: "agent", desc: "Pricing insights" },
  { name: "Writer Agent", icon: PenLine, type: "agent", desc: "Draft report" },
  { name: "Human Approval", icon: ShieldCheck, type: "gate", desc: "Review before send" },
  { name: "Send Email", icon: Send, type: "tool", desc: "To team@acme.com" },
];

const schedules = [
  { name: "AI News Research", schedule: "Every day at 08:00", agent: "Research Agent", status: "running", next: "tomorrow 08:00", timezone: "Asia/Kolkata" },
  { name: "Competitor Analysis", schedule: "Every Monday", agent: "Research Agent", status: "running", next: "Mon 09:00", timezone: "Asia/Kolkata" },
  { name: "GitHub Issue Summary", schedule: "Every night at 23:30", agent: "Coding Agent", status: "paused", next: "—", timezone: "UTC" },
  { name: "Business Analytics", schedule: "Every month on the 1st", agent: "Data Analyst", status: "running", next: "Sep 1 09:00", timezone: "Asia/Kolkata" },
];

const nodeColors: Record<string, string> = {
  trigger: "border-violet-300 bg-violet-50 text-violet-700",
  agent: "border-indigo-200 bg-indigo-50 text-indigo-700",
  tool: "border-border bg-white text-foreground",
  gate: "border-amber-200 bg-amber-50 text-amber-700",
};

export default function WorkflowsPage() {
  const { data: agents = [] } = useQuery<Agent[]>({ queryKey: ["agents"], queryFn: () => api.get("/api/agents") });
  const [goal, setGoal] = useState("");
  const [agentId, setAgentId] = useState<string>("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<WorkflowRun | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (!goal.trim() || running) return;
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const res = await api.post<WorkflowRun>("/api/workflows/run", { goal: goal.trim(), agent_id: agentId ? Number(agentId) : null });
      setResult(res);
    } catch (err: any) {
      setError(err?.detail?.message || err?.message || "Workflow failed.");
    } finally {
      setRunning(false);
    }
  }

  const steps = result?.steps ?? [];

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <PageHeader
        eyebrow="Automation"
        title="Workflows"
        description="Connect agents, tools and approvals into workflows that run automatically."
      />

      <Tabs defaultValue="runs">
        <TabsList>
          <TabsTrigger value="runs">Run</TabsTrigger>
          <TabsTrigger value="builder">Builder</TabsTrigger>
          <TabsTrigger value="schedules">Schedules</TabsTrigger>
        </TabsList>

        <TabsContent value="runs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Run a multi-agent workflow</CardTitle>
              <CardDescription>The manager decomposes your goal and dispatches research, coding, and data specialists in parallel.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="goal" className="text-sm font-medium">Goal</label>
                <Textarea
                  id="goal"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  rows={3}
                  placeholder="e.g. Research the latest AI agent frameworks and build a comparison report"
                />
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="space-y-2 sm:flex-1">
                  <label htmlFor="agent" className="text-sm font-medium">Optional agent context</label>
                  <select
                    id="agent"
                    value={agentId}
                    onChange={(e) => setAgentId(e.target.value)}
                    className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">None (default behavior)</option>
                    {agents.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.icon} {a.name}
                      </option>
                    ))}
                  </select>
                </div>
                <Button onClick={run} disabled={running || !goal.trim()} className="bg-gradient-to-r from-violet-600 to-indigo-600 shadow-md shadow-violet-600/20">
                  {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                  {running ? "Running…" : "Run workflow"}
                </Button>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </CardContent>
          </Card>

          {running && (
            <Card>
              <CardContent className="flex items-center gap-3 p-6">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <div className="text-sm">
                  <p className="font-medium">Manager agent is orchestrating…</p>
                  <p className="text-muted-foreground">Planning subtasks, dispatching specialists, synthesizing results.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {result && (
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-base">Workflow complete</CardTitle>
                  <Badge variant="secondary">{result.model || "default"} · {formatNumber(result.tokens)} tokens · {formatCost(result.cost)}</Badge>
                </div>
                <CardDescription>Run {result.run_id.slice(0, 8)}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {steps.map((s, i) => (
                    <div key={i} className="flex items-start gap-3">
                      {i > 0 && <ArrowRight className="h-4 w-4 -mt-1 shrink-0 rotate-90 text-muted-foreground/40" />}
                      <div className="flex items-start gap-2 rounded-lg border p-3">
                        {s.status === "completed" ? (
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                        ) : s.status === "failed" ? (
                          <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                        ) : (
                          <CircleDashed className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        )}
                        <div>
                          <p className="text-sm font-medium">{s.name}</p>
                          {SPECIALIST_ICON[Object.keys(SPECIALIST_ICON).find((k) => s.name.includes(k)) ?? ""] && (
                            <p className="text-xs text-muted-foreground">
                              {SPECIALIST_ICON[Object.keys(SPECIALIST_ICON).find((k) => s.name.includes(k)) ?? ""]} specialist agent
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {Object.entries(result.specialist_outputs || {}).map(([key, output]) => (
                    <div key={key} className="rounded-lg border bg-muted/40 p-3">
                      <p className="mb-1 flex items-center gap-1.5 text-sm font-medium">
                        <Bot className="h-3.5 w-3.5" /> {key}
                      </p>
                      <p className="line-clamp-3 whitespace-pre-wrap text-xs text-muted-foreground">{output}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-lg border p-4">
                  <p className="mb-2 text-sm font-medium">Final result</p>
                  <Markdown content={result.result} />
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="builder" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Visual Workflow Builder</CardTitle>
                <CardDescription>Drag nodes to assemble your automation. Supports conditions, loops and retries.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center gap-1 rounded-xl border bg-muted/20 p-5">
                  {builderNodes.map((node, i) => (
                    <div key={node.name} className="flex w-full flex-col items-center">
                      <div className={`flex w-full max-w-xs cursor-grab items-center gap-3 rounded-xl border px-3.5 py-2.5 shadow-sm transition-all hover:shadow-md ${nodeColors[node.type]}`}>
                        <GripVertical className="h-3.5 w-3.5 opacity-40" />
                        <node.icon className="h-4 w-4 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold">{node.name}</p>
                          <p className="truncate text-[10px] opacity-70">{node.desc}</p>
                        </div>
                        {node.type === "gate" && <ShieldCheck className="h-3.5 w-3.5 shrink-0" />}
                      </div>
                      {i < builderNodes.length - 1 && <ArrowRight className="my-1 h-3.5 w-3.5 rotate-90 text-violet-400" />}
                    </div>
                  ))}
                  <button className="mt-3 flex items-center gap-1.5 rounded-full border border-dashed border-violet-300 bg-violet-50/50 px-4 py-2 text-xs font-medium text-violet-600 transition-colors hover:bg-violet-50">
                    <Plus className="h-3.5 w-3.5" /> Add step
                  </button>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <Badge variant="outline">7 nodes · 2 agents · 1 approval gate</Badge>
                  <Button variant="outline" size="sm">Edit plan</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Workflow Blueprint</CardTitle>
                <CardDescription>Pre-flight plan NexaAgent will follow for this workflow.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {[
                  "01 · Trigger on schedule (Mon 09:00)",
                  "02 · Research Agent gathers competitor data",
                  "03 · Web Search retrieves 20 sources",
                  "04 · Data Analyzer compares pricing models",
                  "05 · Writer Agent drafts the report",
                  "06 · Human approval required before send",
                  "07 · Send Email to team@acme.com",
                ].map((step, i) => (
                  <div key={step} className="flex items-center gap-3 rounded-lg border p-2.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-violet-100 text-xs font-semibold text-violet-700">
                      {i + 1}
                    </span>
                    <span className="text-sm">{step.split("· ").slice(1).join("· ")}</span>
                  </div>
                ))}
                <Button className="mt-2 w-full bg-gradient-to-r from-violet-600 to-indigo-600 shadow-md shadow-violet-600/20">
                  <Play className="h-4 w-4" /> Approve &amp; Run
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="schedules" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Scheduled Agents</CardTitle>
              <CardDescription>Automate recurring work on cron-like schedules with full timezone support.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {schedules.map((s) => (
                  <div key={s.name} className="flex flex-wrap items-center gap-3 rounded-lg border p-3.5 transition-colors hover:bg-muted/40">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                      <CalendarClock className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{s.name}</p>
                      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {s.schedule}</span>
                        <span>{s.agent}</span>
                        <span>· next: {s.next}</span>
                      </p>
                    </div>
                    <Badge variant={s.status === "running" ? "success" : "muted"} className="capitalize">{s.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}