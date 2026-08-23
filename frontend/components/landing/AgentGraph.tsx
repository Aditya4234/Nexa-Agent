"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  Globe,
  FileText,
  BarChart3,
  ShieldCheck,
  CheckCircle2,
  CircleDashed,
  Loader2,
  Flag,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NodeStatus = "done" | "running" | "waiting";

interface GraphNode {
  id: string;
  name: string;
  icon: typeof Globe;
  desc: string;
  time?: string;
}

const nodes: GraphNode[] = [
  { id: "planner", name: "Planner", icon: Brain, desc: "Breaking task into 5 steps", time: "0.4s" },
  { id: "web", name: "Web Search", icon: Globe, desc: "Searching competitor pricing", time: "1.2s" },
  { id: "files", name: "PDF Reader", icon: FileText, desc: "Reading pricing_2026.pdf", time: "0.8s" },
  { id: "analyzer", name: "Analyzer", icon: BarChart3, desc: "Comparing pricing models", time: "2.4s" },
  { id: "approval", name: "Human Approval", icon: ShieldCheck, desc: "Required before sending" },
  { id: "result", name: "Final Result", icon: Flag, desc: "Memo drafted with citations" },
];

function statusFor(index: number, active: number): NodeStatus {
  if (index < active) return "done";
  if (index === active) return "running";
  return "waiting";
}

export function AgentGraph({ compact = false }: { compact?: boolean }) {
  const [active, setActive] = useState(1);

  useEffect(() => {
    const timers = [1600, 2600, 3600, 4400].map(
      (t, i) => setTimeout(() => setActive(i + 1), t)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className={cn("mx-auto w-full", compact ? "max-w-md" : "max-w-2xl")}>
      <div className="relative flex flex-col items-center">
        <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-gradient-to-b from-violet-500/0 via-violet-500/20 to-indigo-500/0" />

        {nodes.map((node, i) => {
          const status = statusFor(i, active);
          return (
            <div key={node.id} className="relative flex w-full flex-col items-center">
              {i > 0 && (
                <motion.div
                  className="h-5 w-px bg-gradient-to-b from-violet-500/40 to-violet-500/60"
                  initial={{ scaleY: 0, opacity: 0 }}
                  animate={{ scaleY: status === "waiting" ? 0.4 : 1, opacity: status === "waiting" ? 0.3 : 1 }}
                  style={{ transformOrigin: "top" }}
                  transition={{ duration: 0.4 }}
                />
              )}

              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.08, duration: 0.35 }}
                className={cn(
                  "relative flex w-full max-w-sm items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-300",
                  status === "done" && "border-violet-200 bg-violet-50/80",
                  status === "running" && "border-violet-500/50 bg-white shadow-lg shadow-violet-500/10",
                  status === "waiting" && "border-border bg-white/70 opacity-60"
                )}
              >
                {status === "running" && (
                  <span className="pointer-events-none absolute -inset-px rounded-xl bg-gradient-to-r from-violet-500/20 via-indigo-500/20 to-violet-500/20 blur-sm" />
                )}
                <span
                  className={cn(
                    "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
                    status === "done" && "border-emerald-200 bg-emerald-50 text-emerald-600",
                    status === "running" && "border-violet-200 bg-violet-50 text-violet-600",
                    status === "waiting" && "border-border bg-muted text-muted-foreground"
                  )}
                >
                  {status === "done" ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : status === "running" ? (
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1.4, ease: "linear" }}
                      className="flex"
                    >
                      <Loader2 className="h-4 w-4" />
                    </motion.span>
                  ) : (
                    <CircleDashed className="h-4 w-4" />
                  )}
                </span>

                <div className="relative min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold">{node.name}</p>
                    {status === "done" && node.time && (
                      <span className="shrink-0 font-mono text-[10px] text-emerald-600">{node.time}</span>
                    )}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{node.desc}</p>
                </div>

                <span
                  className={cn(
                    "relative shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
                    status === "done" && "bg-emerald-100 text-emerald-700",
                    status === "running" && "bg-violet-100 text-violet-700",
                    status === "waiting" && "bg-muted text-muted-foreground"
                  )}
                >
                  {status === "done" ? "Completed" : status === "running" ? "Running" : "Waiting"}
                </span>
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
}