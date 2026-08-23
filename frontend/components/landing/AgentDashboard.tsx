"use client";

import { motion } from "framer-motion";
import {
  Bot,
  Code2,
  BarChart3,
  PenLine,
  CheckCircle2,
  Loader2,
  CircleDashed,
  ArrowDown,
  Plus,
  Search,
  FileText,
  Globe,
  MoreHorizontal,
} from "lucide-react";

const agents = [
  { name: "Research", icon: Globe, active: true, runs: "12 runs", dot: "bg-emerald-400" },
  { name: "Coding", icon: Code2, active: true, runs: "4 runs", dot: "bg-violet-400" },
  { name: "Analyst", icon: BarChart3, active: true, runs: "8 runs", dot: "bg-emerald-400" },
  { name: "Writer", icon: PenLine, active: false, runs: "idle", dot: "bg-white/25" },
];

const activity = [
  { icon: Globe, text: "Web Search", time: "12s ago", done: true },
  { icon: Search, text: "Browser", time: "11s ago", done: true },
  { icon: FileText, text: "PDF Read", time: "9s ago", done: true },
  { icon: BarChart3, text: "Analysis", time: "now", done: false },
];

const graphNodes = [
  { name: "Planner", state: "done" },
  { name: "Research", state: "done" },
  { name: "Analyze", state: "running" },
  { name: "Result", state: "waiting" },
];

export function AgentDashboard() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3.5 py-1.5 text-xs font-medium text-violet-700">
              Agent control center
            </span>
            <h2 className="mt-6 text-3xl font-bold tracking-tight sm:text-5xl">
              Your agents, orchestrated from one place
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Manage agents, watch workspaces and track every action — a real SaaS workspace for your AI team.
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mt-14 overflow-hidden rounded-2xl border bg-white shadow-2xl shadow-violet-900/10"
        >
          {/* Top bar */}
          <div className="flex items-center justify-between border-b px-5 py-3.5">
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 text-white">
                <Bot className="h-4 w-4" />
              </span>
              <span className="text-sm font-semibold">NexaAgent</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 sm:inline-flex">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                3 agents running
              </span>
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-300" />
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-[200px_1fr_240px]">
            {/* Agents sidebar */}
            <aside className="border-r p-4">
              <p className="mb-3 px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Agents
              </p>
              <div className="space-y-1">
                {agents.map((agent) => (
                  <div
                    key={agent.name}
                    className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 ${
                      agent.active ? "bg-violet-50 ring-1 ring-violet-200" : ""
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${agent.dot}`} />
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      <agent.icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium">{agent.name}</p>
                      <p className="text-[10px] text-muted-foreground">{agent.runs}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
                <Plus className="h-3.5 w-3.5" /> New agent
              </button>
            </aside>

            {/* Workspace */}
            <div className="p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold">Competitor Research Agent</h3>
                  <p className="text-xs text-muted-foreground">Researching 3 competitors · goal #12</p>
                </div>
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </div>

              <div className="mt-5 rounded-xl border bg-muted/30 p-5">
                <p className="mb-4 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Agent graph
                </p>
                <div className="flex flex-col items-center gap-1.5">
                  {graphNodes.map((node, i) => (
                    <div key={node.name} className="flex w-full max-w-xs flex-col items-center">
                      <div
                        className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-xs font-medium ${
                          node.state === "running"
                            ? "border-violet-300 bg-violet-50 text-violet-700 shadow-sm"
                            : node.state === "done"
                            ? "border-border bg-white text-foreground"
                            : "border-border bg-white text-muted-foreground"
                        }`}
                      >
                        {node.name}
                        {node.state === "done" && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
                        {node.state === "running" && (
                          <motion.span
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                            className="flex"
                          >
                            <Loader2 className="h-3.5 w-3.5 text-violet-500" />
                          </motion.span>
                        )}
                        {node.state === "waiting" && <CircleDashed className="h-3.5 w-3.5 text-muted-foreground/50" />}
                      </div>
                      {i < graphNodes.length - 1 && <ArrowDown className="my-0.5 h-3.5 w-3.5 text-muted-foreground/50" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Activity */}
            <aside className="border-l p-4">
              <p className="mb-3 px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Activity
              </p>
              <div className="space-y-2">
                {activity.map((item) => (
                  <div key={item.text} className="flex items-center gap-2.5 rounded-lg px-2 py-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-violet-50 text-violet-600">
                      <item.icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium">{item.text}</p>
                      <p className="text-[10px] text-muted-foreground">{item.time}</p>
                    </div>
                    {item.done ? (
                      <CheckCircle2 className="ml-auto h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    ) : (
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                        className="ml-auto flex"
                      >
                        <Loader2 className="h-3.5 w-3.5 shrink-0 text-violet-500" />
                      </motion.span>
                    )}
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </motion.div>
      </div>
    </section>
  );
}