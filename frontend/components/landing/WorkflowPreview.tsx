"use client";

import { motion } from "framer-motion";
import {
  Zap,
  Search,
  BarChart3,
  PenLine,
  ShieldCheck,
  Send,
  ArrowDown,
  Plus,
  GripVertical,
  Workflow,
} from "lucide-react";

const nodes = [
  { name: "Trigger", icon: Zap, type: "trigger", desc: "Every Monday 9:00" },
  { name: "Research Agent", icon: Search, type: "agent", desc: "Competitors · market" },
  { name: "Web Search", icon: Search, type: "tool", desc: "20 sources" },
  { name: "Data Analyzer", icon: BarChart3, type: "agent", desc: "Pricing insights" },
  { name: "Writer Agent", icon: PenLine, type: "agent", desc: "Draft report" },
  { name: "Human Approval", icon: ShieldCheck, type: "gate", desc: "Review before send" },
  { name: "Send Email", icon: Send, type: "tool", desc: "To team@acme.com" },
];

const colors: Record<string, string> = {
  trigger: "border-violet-300 bg-violet-50 text-violet-700",
  agent: "border-indigo-200 bg-indigo-50 text-indigo-700",
  tool: "border-border bg-white text-foreground",
  gate: "border-amber-200 bg-amber-50 text-amber-700",
};

export function WorkflowPreview() {
  return (
    <section id="workflows" className="scroll-mt-20 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3.5 py-1.5 text-xs font-medium text-violet-700">
              <Workflow className="h-3.5 w-3.5" />
              Workflow builder
            </span>
            <h2 className="mt-6 text-3xl font-bold tracking-tight sm:text-5xl">
              Turn complex tasks into{" "}
              <span className="bg-gradient-to-r from-violet-600 to-indigo-500 bg-clip-text text-transparent">
                autonomous workflows.
              </span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Connect agents, tools and approval steps into workflows that run automatically.
            </p>
            <div className="mt-8 space-y-3">
              {[
                "Visual node-based builder",
                "Schedule or trigger on demand",
                "Reusable workflow templates",
              ].map((point) => (
                <div key={point} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                    <Zap className="h-3 w-3" />
                  </span>
                  {point}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Builder preview */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="relative overflow-hidden rounded-2xl border bg-white p-6 shadow-2xl shadow-violet-900/10"
          >
            <div className="mb-5 flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 text-white">
                  <Workflow className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold">Weekly competitor briefing</p>
                  <p className="text-[10px] text-muted-foreground">7 nodes · runs automatically</p>
                </div>
              </div>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-medium text-emerald-700">
                Active
              </span>
            </div>

            <div className="flex flex-col items-center gap-1">
              {nodes.map((node, i) => (
                <div key={node.name} className="flex w-full flex-col items-center">
                  <div
                    className={`flex w-full max-w-xs cursor-grab items-center gap-3 rounded-xl border px-3.5 py-2.5 shadow-sm transition-all hover:shadow-md ${colors[node.type]}`}
                  >
                    <GripVertical className="h-3.5 w-3.5 opacity-40" />
                    <node.icon className="h-4 w-4 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold">{node.name}</p>
                      <p className="truncate text-[10px] opacity-70">{node.desc}</p>
                    </div>
                    {node.type === "gate" && <ShieldCheck className="h-3.5 w-3.5 shrink-0" />}
                  </div>
                  {i < nodes.length - 1 && <ArrowDown className="my-1 h-3.5 w-3.5 text-violet-400" />}
                </div>
              ))}
            </div>

            <button className="mx-auto mt-5 flex items-center gap-1.5 rounded-full border border-dashed border-violet-300 bg-violet-50/50 px-4 py-2 text-xs font-medium text-violet-600 transition-colors hover:bg-violet-50">
              <Plus className="h-3.5 w-3.5" />
              Add step
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}