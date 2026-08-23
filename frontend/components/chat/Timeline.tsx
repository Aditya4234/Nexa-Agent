"use client";

import { CheckCircle2, Loader2, XCircle, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TimelineStep } from "@/types";

export function Timeline({ steps }: { steps: TimelineStep[] }) {
  if (!steps || steps.length === 0) return null;

  return (
    <div className="my-2 flex flex-wrap items-center gap-1.5">
      {steps.map((step) => (
        <span
          key={step.id}
          title={step.detail}
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
            step.status === "completed" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
            step.status === "running" && "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
            step.status === "failed" && "border-destructive/30 bg-destructive/10 text-destructive",
            step.status === "pending" && "border-border bg-muted/50 text-muted-foreground"
          )}
        >
          {step.status === "completed" ? (
            <CheckCircle2 className="h-3 w-3" />
          ) : step.status === "running" ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : step.status === "failed" ? (
            <XCircle className="h-3 w-3" />
          ) : (
            <Circle className="h-3 w-3" />
          )}
          {step.label}
        </span>
      ))}
    </div>
  );
}