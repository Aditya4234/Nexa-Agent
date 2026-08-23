"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Search,
  Code2,
  BarChart3,
  PenLine,
  Target,
  FolderSearch,
  ArrowRight,
  Sparkles,
} from "lucide-react";

const templates = [
  { name: "Research Agent", desc: "Research competitors, markets and products.", icon: Search },
  { name: "Coding Agent", desc: "Write, test and debug code.", icon: Code2 },
  { name: "Data Analyst", desc: "Analyze datasets and generate insights.", icon: BarChart3 },
  { name: "Content Agent", desc: "Research and create high-quality content.", icon: PenLine },
  { name: "Sales Agent", desc: "Research leads and prepare outreach.", icon: Target },
  { name: "Knowledge Agent", desc: "Search private documents and answer questions.", icon: FolderSearch },
];

export function AgentTemplates() {
  return (
    <section id="agents" className="scroll-mt-20 border-t bg-muted/30 py-24 sm:py-32">
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
              Agent templates
            </span>
            <h2 className="mt-6 text-3xl font-bold tracking-tight sm:text-5xl">
              Start with an agent that already knows what to do.
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Kick off from a proven template, then customize tools, memory and models.
            </p>
          </motion.div>
        </div>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template, i) => (
            <motion.div
              key={template.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.1 }}
              className="group relative rounded-2xl border bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-violet-200 hover:shadow-xl hover:shadow-violet-900/10"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/20">
                  <template.icon className="h-5 w-5" />
                </div>
                <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-medium text-muted-foreground">
                  Template
                </span>
              </div>
              <h3 className="mt-5 text-lg font-semibold">{template.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{template.desc}</p>
              <Link
                href="/signup"
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-violet-600 transition-colors hover:text-violet-700"
              >
                Use template
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}