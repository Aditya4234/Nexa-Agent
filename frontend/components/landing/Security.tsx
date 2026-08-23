"use client";

import { motion } from "framer-motion";
import {
  Box,
  KeyRound,
  ShieldCheck,
  UserCheck,
  ScrollText,
  History,
  Lock,
  PlugZap,
  Sparkles,
} from "lucide-react";

const items = [
  { icon: Box, title: "Sandboxed execution", desc: "Every action runs isolated from your system." },
  { icon: KeyRound, title: "API key management", desc: "Secrets encrypted and scoped per agent." },
  { icon: ShieldCheck, title: "Permission controls", desc: "Granular control over tools and actions." },
  { icon: UserCheck, title: "Human approval", desc: "Pause risky actions for review." },
  { icon: ScrollText, title: "Audit logs", desc: "Full trace of every decision and call." },
  { icon: History, title: "Execution history", desc: "Replay any past run, step by step." },
  { icon: Lock, title: "Private knowledge", desc: "Your data never trains shared models." },
  { icon: PlugZap, title: "Secure tool access", desc: "Least-privilege access to connected tools." },
];

export function Security() {
  return (
    <section className="border-t bg-muted/30 py-24 sm:py-32">
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
              Enterprise trust
            </span>
            <h2 className="mt-6 text-3xl font-bold tracking-tight sm:text-5xl">
              Powerful agents.{" "}
              <span className="bg-gradient-to-r from-violet-600 to-indigo-500 bg-clip-text text-transparent">
                Controlled execution.
              </span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Autonomy where it helps, guardrails where it matters.
            </p>
          </motion.div>
        </div>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: (i % 4) * 0.08 }}
              className="group rounded-2xl border bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100 transition-colors group-hover:bg-emerald-100">
                <item.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold">{item.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}