"use client";

import { motion } from "framer-motion";
import {
  FileText,
  BookOpen,
  FolderSearch,
  Globe,
  ArrowDown,
  Database,
  ScanSearch,
  Bot,
  Check,
} from "lucide-react";

const docs = [
  { name: "Product Documentation", icon: BookOpen },
  { name: "Pricing.pdf", icon: FileText },
  { name: "Company Wiki", icon: FolderSearch },
  { name: "Research Reports", icon: Globe },
];

const capabilities = [
  "PDFs",
  "Markdown",
  "Websites",
  "Documents",
  "Vector search",
  "Semantic search",
  "Metadata filtering",
];

export function KnowledgeSection() {
  return (
    <section className="relative overflow-hidden bg-[#0b0b14] py-24 text-white sm:py-32">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_80%_20%,rgba(124,58,237,0.16),transparent)]" />
        <div className="absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-violet-500/60 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-violet-300">
                <Database className="h-3.5 w-3.5" />
                Memory &amp; knowledge
              </span>
              <h2 className="mt-6 text-3xl font-bold tracking-tight sm:text-5xl">
                Agents that remember and{" "}
                <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                  know your world.
                </span>
              </h2>
              <p className="mt-4 text-lg text-white/60">
                Connect private knowledge bases and give agents persistent memory — grounded answers with citations, not guesses.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-8 flex flex-wrap gap-2"
            >
              {capabilities.map((cap) => (
                <span
                  key={cap}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70"
                >
                  <Check className="h-3 w-3 text-violet-400" />
                  {cap}
                </span>
              ))}
            </motion.div>
          </div>

          {/* Knowledge base visual */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl shadow-violet-950/40 backdrop-blur-xl sm:p-8"
          >
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm font-semibold">Knowledge Base</p>
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[10px] text-white/50">
                4,281 chunks · 128 MB
              </span>
            </div>

            <div className="space-y-2">
              {docs.map((doc) => (
                <div
                  key={doc.name}
                  className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-2.5 transition-colors hover:bg-white/[0.06]"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/15 text-violet-300">
                    <doc.icon className="h-4 w-4" />
                  </span>
                  <span className="text-sm text-white/80">{doc.name}</span>
                  <span className="ml-auto font-mono text-[10px] text-white/40">✓ indexed</span>
                </div>
              ))}
            </div>

            <div className="my-6 flex items-center justify-center gap-3">
              <span className="h-px flex-1 bg-gradient-to-r from-transparent to-violet-400/40" />
              <span className="flex items-center gap-1.5 rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-[10px] font-medium text-violet-300">
                <ScanSearch className="h-3 w-3" />
                Vector search
              </span>
              <span className="h-px flex-1 bg-gradient-to-l from-transparent to-violet-400/40" />
            </div>

            <div className="flex flex-col items-center gap-1">
              {[
                { label: "Relevant context", icon: Database },
                { label: "Agent", icon: Bot },
              ].map((item, i) => (
                <div key={item.label} className="flex w-full max-w-xs flex-col items-center">
                  {i === 0 && <ArrowDown className="mb-1 h-3.5 w-3.5 text-violet-400" />}
                  <div className="flex w-full items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-300">
                      <item.icon className="h-4 w-4" />
                    </span>
                    <span className="text-sm text-white/80">{item.label}</span>
                    {i === 0 && <span className="ml-auto font-mono text-[10px] text-white/40">top-5</span>}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}