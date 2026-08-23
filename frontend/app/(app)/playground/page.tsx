"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Play, Loader2, CheckCircle2, CircleDashed, Cog, Wrench, Coins, Clock, Terminal, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Agent, ToolInfo } from "@/types";

const steps = [
  { name: "Planner", state: "done", detail: "Decomposed goal into 4 subtasks" },
  { name: "Web Search", state: "done", detail: "3 sources retrieved" },
  { name: "RAG Retrieval", state: "done", detail: "2 chunks from pricing_2026.pdf" },
  { name: "Analyzer", state: "running", detail: "Comparing pricing models…" },
  { name: "Writer", state: "waiting", detail: "Waiting for analysis" },
];

export default function PlaygroundPage() {
  const { data: agents = [] } = useQuery<Agent[]>({ queryKey: ["agents"], queryFn: () => api.get("/api/agents") });
  const { data: tools = [] } = useQuery<ToolInfo[]>({ queryKey: ["tools"], queryFn: () => api.get("/api/runs/meta/tools") });

  const [goal, setGoal] = useState("");
  const [agentId, setAgentId] = useState("");
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(2);

  const run = () => {
    if (!goal.trim() || running) return;
    setRunning(true);
    setProgress(0);
    const timers = [900, 1800, 2700, 3600, 4500].map((t, i) => setTimeout(() => setProgress(i + 1), t));
    setTimeout(() => {
      setRunning(false);
      timers.forEach(clearTimeout);
    }, 5600);
  };

  const selected = agents.find((a) => String(a.id) === agentId);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <PageHeader
        eyebrow="Developer Playground"
        title="Agent Playground"
        description="Configure an agent, fire a goal and watch it plan, call tools and deliver — live."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Config */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Cog className="h-4 w-4" /> Agent Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Goal</label>
              <Textarea
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                rows={3}
                placeholder="e.g. Research 3 competitors and summarize their pricing models"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Agent</label>
              <select
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">Default agent (auto)</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.icon} {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">Tools ({tools.length} available)</p>
              <div className="flex flex-wrap gap-1.5">
                {tools.slice(0, 8).map((t) => (
                  <span key={t.id} className="inline-flex items-center gap-1.5 rounded-full border bg-muted/50 px-2.5 py-1 text-xs">
                    <Wrench className="h-3 w-3 text-violet-600" /> {t.name}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Model</p>
                <p className="font-medium">{selected?.model === "default" ? "Auto" : selected?.model || "Auto"}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Memory</p>
                <p className="font-medium">{selected?.memory_enabled ? "Enabled" : "Off"}</p>
              </div>
            </div>
            <Button
              onClick={run}
              disabled={running || !goal.trim()}
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 shadow-lg shadow-violet-600/25"
            >
              {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {running ? "Running…" : "Run Agent"}
            </Button>
          </CardContent>
        </Card>

        {/* Live execution */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Terminal className="h-4 w-4" /> Live Execution
              </CardTitle>
              <Badge variant={running ? "warning" : "secondary"} className="gap-1.5">
                <span className={cn("h-1.5 w-1.5 rounded-full", running ? "animate-pulse bg-amber-500" : "bg-muted-foreground")} />
                {running ? "Running" : "Idle"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {steps.map((s, i) => {
                const isActive = i === progress && running;
                const isDone = i < progress || (!running && i < 4);
                return (
                  <motion.div
                    key={s.name}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06, duration: 0.3 }}
                    className={cn(
                      "flex items-start gap-3 rounded-lg px-3 py-2.5",
                      isActive && "bg-violet-500/10 ring-1 ring-violet-400/20"
                    )}
                  >
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center">
                      {isDone ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : isActive ? (
                        <Loader2 className="h-4 w-4 animate-spin text-violet-500" />
                      ) : (
                        <CircleDashed className="h-4 w-4 text-muted-foreground/40" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className={cn("text-sm font-medium", !isDone && !isActive && "text-muted-foreground/60")}>{s.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{s.detail}</p>
                    </div>
                    <span className="ml-auto shrink-0 font-mono text-[10px] text-muted-foreground">
                      {isDone ? "✓" : isActive ? "…" : "○"}
                    </span>
                  </motion.div>
                );
              })}
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2 text-center">
              {[
                { label: "Tokens", value: running ? "3,204" : "—", icon: Coins },
                { label: "Cost", value: running ? "$0.04" : "—", icon: Coins },
                { label: "Latency", value: running ? "3.8s" : "—", icon: Clock },
              ].map((s) => (
                <div key={s.label} className="rounded-lg border bg-muted/30 p-2.5">
                  <div className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                    <s.icon className="h-3 w-3" /> {s.label}
                  </div>
                  <p className="mt-1 font-mono text-sm">{s.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
              <span>4 tool calls logged</span>
              <span className="inline-flex items-center gap-1 text-violet-600">
                View trace <ArrowRight className="h-3 w-3" />
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}