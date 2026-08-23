"use client";

import { motion } from "framer-motion";
import {
  Target,
  Wrench,
  Play,
  SearchCheck,
  ArrowDown,
  Bot,
  Database,
  ListChecks,
  BadgeCheck,
  Flag,
} from "lucide-react";

const steps = [
  {
    n: "01",
    title: "Define",
    text: "Give your agent a goal in plain language.",
    icon: Target,
  },
  {
    n: "02",
    title: "Equip",
    text: "Connect tools, APIs, documents and knowledge.",
    icon: Wrench,
  },
  {
    n: "03",
    title: "Execute",
    text: "The agent plans and performs multi-step tasks.",
    icon: Play,
  },
  {
    n: "04",
    title: "Review",
    text: "Monitor execution, approve actions and receive results.",
    icon: SearchCheck,
  },
];

const flow = [
  { label: "Goal", icon: Target },
  { label: "Agent", icon: Bot },
  { label: "Tools + Knowledge", icon: Database },
  { label: "Planning", icon: ListChecks },
  { label: "Execution", icon: Play },
  { label: "Review", icon: SearchCheck },
  { label: "Result", icon: Flag },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 border-t bg-muted/30 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3.5 py-1.5 text-xs font-medium text-violet-700">
              How it works
            </span>
            <h2 className="mt-6 text-3xl font-bold tracking-tight sm:text-5xl">
              From goal to result,{" "}
              <span className="bg-gradient-to-r from-violet-600 to-indigo-500 bg-clip-text text-transparent">
                autonomously.
              </span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              No code required. If you can write a sentence, you can build an agent.
            </p>
          </motion.div>
        </div>

        {/* Steps */}
        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <motion.div
              key={step.n}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group relative rounded-2xl border bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-violet-900/10"
            >
              <span className="text-4xl font-bold text-violet-600/15 transition-colors group-hover:text-violet-600/30">
                {step.n}
              </span>
              <div className="mt-4 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 ring-1 ring-violet-100">
                <step.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.text}</p>
            </motion.div>
          ))}
        </div>

        {/* Flow */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mt-16 flex max-w-3xl flex-wrap items-center justify-center gap-x-2 gap-y-2"
        >
          {flow.map((node, i) => (
            <div key={node.label} className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm font-medium shadow-sm">
                <node.icon className="h-4 w-4 text-violet-600" />
                {node.label}
              </div>
              {i < flow.length - 1 && <ArrowDown className="h-3.5 w-3.5 rotate-[-90deg] text-violet-400 sm:rotate-0" />}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}