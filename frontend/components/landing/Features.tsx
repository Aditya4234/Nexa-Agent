"use client";

import { motion } from "framer-motion";
import {
  Bot,
  Plug,
  Brain,
  Network,
  ShieldCheck,
  Activity,
  Sparkles,
  Search,
  Wrench,
  Users,
  Eye,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: Bot,
    title: "Autonomous Agents",
    description: "Agents can independently plan and execute multi-step tasks.",
    accent: "from-violet-500/15 to-purple-500/5",
    iconBg: "bg-violet-50 text-violet-600",
    visual: "Planning → Executing → Delivering",
  },
  {
    icon: Wrench,
    title: "Tool Calling",
    description: "Connect web search, APIs, databases, browsers and custom tools.",
    accent: "from-indigo-500/15 to-blue-500/5",
    iconBg: "bg-indigo-50 text-indigo-600",
    visual: "Search · API · Code · DB",
  },
  {
    icon: Brain,
    title: "Memory & Knowledge",
    description: "Give agents persistent memory and private knowledge bases.",
    accent: "from-purple-500/15 to-fuchsia-500/5",
    iconBg: "bg-purple-50 text-purple-600",
    visual: "Docs → Vectors → Context",
  },
  {
    icon: Network,
    title: "Multi-Agent Workflows",
    description: "Let specialized agents collaborate on complex tasks.",
    accent: "from-blue-500/15 to-cyan-500/5",
    iconBg: "bg-blue-50 text-blue-600",
    visual: "Specialists in parallel",
  },
  {
    icon: ShieldCheck,
    title: "Human-in-the-Loop",
    description: "Pause execution when human approval is required.",
    accent: "from-emerald-500/15 to-teal-500/5",
    iconBg: "bg-emerald-50 text-emerald-600",
    visual: "Approve before action",
  },
  {
    icon: Activity,
    title: "Real-Time Execution",
    description: "Watch agent planning, tool calls and task progress live.",
    accent: "from-rose-500/15 to-orange-500/5",
    iconBg: "bg-rose-50 text-rose-600",
    visual: "Live trace of every step",
  },
];

export function Features() {
  return (
    <section id="features" className="scroll-mt-20 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3.5 py-1.5 text-xs font-medium text-violet-700">
              <Sparkles className="h-3.5 w-3.5" />
              Everything an agent needs
            </span>
            <h2 className="mt-6 text-3xl font-bold tracking-tight sm:text-5xl">
              Not a chatbot.{" "}
              <span className="bg-gradient-to-r from-violet-600 to-indigo-500 bg-clip-text text-transparent">
                A working AI team.
              </span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Agents, tools, memory, workflows and control — combined into one platform.
            </p>
          </motion.div>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.1 }}
              className="group relative overflow-hidden rounded-2xl border bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-900/10"
            >
              <div
                aria-hidden
                className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${feature.accent} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
              />
              <div className="relative">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${feature.iconBg} ring-1 ring-black/5`}>
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
                <div className="mt-5 flex items-center gap-1.5">
                  <Zap className="h-3 w-3 text-violet-500" />
                  <span className="text-xs font-medium text-violet-600">{feature.visual}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}