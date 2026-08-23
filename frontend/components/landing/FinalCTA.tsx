"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Workflow, Check } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,rgba(139,92,246,0.12),transparent)]" />
        <div className="absolute left-1/2 top-1/2 h-px w-3/4 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-transparent via-violet-300/60 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Your first AI agent is{" "}
            <span className="bg-gradient-to-r from-violet-600 to-indigo-500 bg-clip-text text-transparent">
              minutes away.
            </span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
            Build, connect and launch an autonomous agent without starting from scratch.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className={cn(
                buttonVariants({ size: "lg" }),
                "group gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 px-8 text-base shadow-lg shadow-violet-600/25 hover:from-violet-600 hover:to-indigo-600"
              )}
            >
              Build your first agent
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="#workflows"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "gap-2 border-border bg-white/70 px-8 text-base backdrop-blur"
              )}
            >
              <Workflow className="h-4 w-4 text-violet-600" />
              Explore workflows
            </Link>
          </div>
          <p className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Check className="h-4 w-4 text-violet-500" />
            Free to start · No credit card required
          </p>
        </motion.div>
      </div>
    </section>
  );
}