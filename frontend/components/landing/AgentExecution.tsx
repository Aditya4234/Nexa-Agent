"use client";

import { motion } from "framer-motion";
import {
  CheckCircle2,
  Loader2,
  CircleDashed,
  Square,
  Pause,
  Clock,
  Zap,
  Wrench,
  ChevronRight,
  ListChecks,
} from "lucide-react";

const steps = [
  { name: "Planner", text: "Breaking task into 5 steps", state: "done" },
  { name: "Web Search", text: "Searching competitor pricing", state: "done" },
  { name: "Document Reader", text: "Reading pricing_2026.pdf", state: "done" },
  { name: "Analyzer", text: "Comparing pricing models", state: "running" },
  { name: "Writer", text: "Waiting", state: "waiting" },
  { name: "Human Approval", text: "Required before sending", state: "waiting" },
];

function StepIcon({ state }: { state: string }) {
  if (state === "done") return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
  if (state === "running")
    return (
      <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }} className="flex">
        <Loader2 className="h-4 w-4 text-violet-400" />
      </motion.span>
    );
  return <CircleDashed className="h-4 w-4 text-white/30" />;
}

export function AgentExecution() {
  return (
    <section className="relative overflow-hidden bg-[#0b0b14] py-24 text-white sm:py-32">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_50%_0%,rgba(124,58,237,0.18),transparent)]" />
        <div className="absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-violet-500/60 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-violet-300">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-400" />
              </span>
              Live agent runtime
            </span>
            <h2 className="mt-6 text-3xl font-bold tracking-tight sm:text-5xl">
              Watch your agents work,{" "}
              <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                step by step.
              </span>
            </h2>
            <p className="mt-4 text-lg text-white/60">
              Follow every plan, tool call and result in real time — with full control.
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mx-auto mt-14 max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-2xl shadow-violet-950/40 backdrop-blur-xl"
        >
          {/* Console header */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </span>
              <div>
                <p className="text-sm font-semibold">Research Competitors &amp; Draft Pricing Memo</p>
                <p className="text-xs text-white/50">Agent execution · run 6f9a12</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Running
            </span>
          </div>

          <div className="grid gap-6 p-5 sm:p-8 lg:grid-cols-[1fr_220px]">
            {/* Steps */}
            <div className="space-y-1">
              {steps.map((step, i) => (
                <motion.div
                  key={step.name}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                  className={`flex items-start gap-3 rounded-lg px-3 py-2.5 ${
                    step.state === "running" ? "bg-violet-500/10 ring-1 ring-violet-400/20" : ""
                  }`}
                >
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center">
                    <StepIcon state={step.state} />
                  </span>
                  <div className="min-w-0">
                    <p className={`text-sm font-medium ${step.state === "waiting" ? "text-white/40" : ""}`}>
                      {step.name}
                    </p>
                    <p className="truncate text-xs text-white/50">{step.text}</p>
                  </div>
                  {step.state === "done" && (
                    <span className="ml-auto shrink-0 font-mono text-[10px] text-white/40">{["0.4s", "1.2s", "0.8s"][i]}</span>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Stats */}
            <div className="flex flex-row flex-wrap gap-3 lg:flex-col">
              {[
                { icon: ListChecks, label: "Current step", value: "4 / 6" },
                { icon: Clock, label: "Elapsed", value: "4.2s" },
                { icon: Zap, label: "Tokens", value: "8,412" },
                { icon: Wrench, label: "Tool calls", value: "7" },
              ].map((stat) => (
                <div key={stat.label} className="flex-1 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 lg:flex-none">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-white/40">
                    <stat.icon className="h-3 w-3" />
                    {stat.label}
                  </div>
                  <p className="mt-1 font-mono text-sm text-white">{stat.value}</p>
                </div>
              ))}

              {/* Progress */}
              <div className="flex-1 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 lg:flex-none">
                <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-wide text-white/40">
                  <span>Progress</span>
                  <span>67%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: "67%" }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2, delay: 0.3 }}
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500"
                  />
                </div>
              </div>

              {/* Controls */}
              <div className="flex gap-2">
                <button className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-white/70 transition-colors hover:bg-white/10">
                  <Pause className="h-3.5 w-3.5" /> Pause
                </button>
                <button className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-300 transition-colors hover:bg-rose-500/20">
                  <Square className="h-3.5 w-3.5" /> Stop
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-white/10 px-5 py-3 text-xs text-white/40">
            <span>Output: memo-draft.md</span>
            <span className="inline-flex items-center gap-1 text-violet-300">
              View full run <ChevronRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}