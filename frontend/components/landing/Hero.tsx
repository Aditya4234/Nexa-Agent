"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Play, Sparkles, Check } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AgentGraph } from "./AgentGraph";

const trustPoints = ["No credit card", "Local & cloud models", "OpenAI compatible"];

export function Hero() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden pb-24 pt-32 sm:pb-32 sm:pt-40">
      {/* Background */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,rgba(139,92,246,0.14),transparent)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-300/60 to-transparent" />
        <div className="absolute -left-40 top-40 h-72 w-72 rounded-full bg-violet-400/10 blur-3xl" />
        <div className="absolute -right-40 top-64 h-72 w-72 rounded-full bg-indigo-400/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-200/80 bg-violet-50/70 px-3.5 py-1.5 text-xs font-medium text-violet-700 shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Autonomous AI agents for real work
          </div>

          <h1 className="text-4xl font-bold leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl">
            Build AI agents that{" "}
            <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-500 bg-clip-text text-transparent">
              actually get work done.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Create autonomous agents, connect tools and knowledge, run multi-step workflows, and
            monitor every execution in real time.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className={cn(
                buttonVariants({ size: "lg" }),
                "group w-full gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 px-8 text-base shadow-lg shadow-violet-600/25 hover:from-violet-600 hover:to-indigo-600 sm:w-auto"
              )}
            >
              Build your first agent
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="#how-it-works"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "w-full gap-2 border-border bg-white/70 px-8 text-base backdrop-blur sm:w-auto"
              )}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                <Play className="h-2.5 w-2.5 fill-current" />
              </span>
              See how it works
            </Link>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {trustPoints.map((point) => (
              <span key={point} className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-violet-500" />
                {point}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Agent execution visualization */}
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="relative mx-auto mt-16 max-w-2xl sm:mt-20"
        >
          <div className="relative overflow-hidden rounded-2xl border border-border bg-white/80 p-5 shadow-2xl shadow-violet-600/10 backdrop-blur-xl sm:p-8">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-300/70 to-transparent" />
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <p className="text-sm font-semibold">Live agent execution</p>
              </div>
              <span className="rounded-full border bg-muted/60 px-2.5 py-1 font-mono text-[10px] text-muted-foreground">
                run · 6f9a12
              </span>
            </div>
            <AgentGraph />
          </div>
        </motion.div>
      </div>
    </section>
  );
}