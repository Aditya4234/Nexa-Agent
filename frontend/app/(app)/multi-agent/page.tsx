"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Network, Bot, Search, Code2, BarChart3, ShieldCheck, CheckCircle2, Loader2, CircleDashed, ArrowDown, Users, GitMerge, MessagesSquare } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusPill } from "@/components/shared/StatusPill";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const SPECIALISTS = [
  { role: "Researcher", icon: Search, status: "done", detail: "Collected 12 sources", output: "Market size, 12 competitor price points, feature matrix." },
  { role: "Coder", icon: Code2, status: "done", detail: "Built comparison script", output: "Parsed pricing pages into structured JSON (24 rows)." },
  { role: "Analyst", icon: BarChart3, status: "running", detail: "Comparing models…", output: "" },
];

export default function MultiAgentPage() {
  const [running, setRunning] = useState(false);
  const [active, setActive] = useState(1);
  const [goal, setGoal] = useState("");

  const run = () => {
    if (!goal.trim() || running) return;
    setRunning(true);
    setActive(0);
    const timers = [1400, 2800, 4000].map((t, i) => setTimeout(() => setActive(i + 1), t));
    setTimeout(() => {
      setRunning(false);
      timers.forEach(clearTimeout);
    }, 5000);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <PageHeader
        eyebrow="Orchestration"
        title="Multi-Agent Collaboration"
        description="Specialized agents delegate, share context and coordinate on complex goals."
      />

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left: orchestration graph */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Network className="h-4 w-4" /> Collaboration Graph
            </CardTitle>
            <CardDescription>Manager delegates to specialists in parallel; reviewer validates the final result.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Manager */}
            <div className="flex flex-col items-center gap-1">
              <div className="flex w-full max-w-sm items-center gap-3 rounded-xl border border-violet-300 bg-violet-50 px-4 py-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/25">
                  <Bot className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold">Manager Agent</p>
                  <p className="text-xs text-violet-600/70">Plans, delegates and synthesizes</p>
                </div>
                <StatusPill status="running" className="ml-auto" />
              </div>

              <div className="flex items-center gap-1 text-violet-400">
                <span className="h-px w-10 bg-violet-300" />
                <ArrowDown className="h-3.5 w-3.5" />
                <span className="h-px w-10 bg-violet-300" />
              </div>

              {/* Specialists */}
              <div className="grid w-full gap-2 sm:grid-cols-3">
                {SPECIALISTS.map((s, i) => {
                  const isActive = i === active && running;
                  const isDone = i < active;
                  return (
                    <motion.div
                      key={s.role}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1, duration: 0.3 }}
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all",
                        isActive && "border-violet-300 bg-violet-50 shadow-md shadow-violet-500/10",
                        isDone && "border-emerald-200 bg-emerald-50/60",
                        !isActive && !isDone && "opacity-70"
                      )}
                    >
                      <span className={cn("flex h-9 w-9 items-center justify-center rounded-lg", isDone ? "bg-emerald-100 text-emerald-600" : "bg-muted text-muted-foreground")}>
                        {isDone ? <CheckCircle2 className="h-4 w-4" /> : isActive ? <Loader2 className="h-4 w-4 animate-spin text-violet-500" /> : <s.icon className="h-4 w-4" />}
                      </span>
                      <p className="text-xs font-semibold">{s.role}</p>
                      <p className="text-[10px] text-muted-foreground">{s.detail}</p>
                    </motion.div>
                  );
                })}
              </div>

              <div className="flex items-center gap-1 text-violet-400">
                <span className="h-px w-10 bg-violet-300" />
                <ArrowDown className="h-3.5 w-3.5" />
                <span className="h-px w-10 bg-violet-300" />
              </div>

              {/* Reviewer + Result */}
              <div className="flex w-full max-w-sm flex-col items-center gap-1">
                <div className="flex w-full items-center gap-3 rounded-xl border px-4 py-3 opacity-80">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                    <ShieldCheck className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">Reviewer</p>
                    <p className="text-xs text-muted-foreground">Validates output quality</p>
                  </div>
                  <CircleDashed className="ml-auto h-4 w-4 text-muted-foreground/50" />
                </div>
                <ArrowDown className="h-3.5 w-3.5 text-violet-400" />
                <div className="flex w-full items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <p className="text-sm font-semibold">Final Result</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right: coordination + outputs */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MessagesSquare className="h-4 w-4" /> Coordination
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea value={goal} onChange={(e) => setGoal(e.target.value)} rows={3} placeholder="e.g. Build a competitor pricing comparison report" />
              <Button onClick={run} disabled={running || !goal.trim()} className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 shadow-md shadow-violet-600/20">
                {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitMerge className="h-4 w-4" />}
                {running ? "Orchestrating…" : "Run multi-agent team"}
              </Button>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                {[{ icon: Users, label: "Agents", value: "4" }, { icon: Network, label: "Delegations", value: "3" }, { icon: Bot, label: "Turnaround", value: "4.2s" }].map((m) => (
                  <div key={m.label} className="rounded-lg border bg-muted/30 p-2.5">
                    <m.icon className="mx-auto h-4 w-4 text-violet-500" />
                    <p className="mt-1 font-semibold">{m.value}</p>
                    <p className="text-muted-foreground">{m.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" /> Specialist Outputs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {SPECIALISTS.map((s) => (
                <div key={s.role} className="rounded-lg border p-3">
                  <div className="mb-1 flex items-center gap-2 text-sm font-medium">
                    <s.icon className="h-3.5 w-3.5 text-violet-600" />
                    {s.role}
                    {s.status === "done" && <Badge variant="success" className="ml-auto text-[10px]">delivered</Badge>}
                  </div>
                  {s.output ? (
                    <p className="line-clamp-2 text-xs text-muted-foreground">{s.output}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground/60">{s.status === "running" ? "Working…" : "Not started"}</p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}