import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type Tone = "success" | "warning" | "danger" | "neutral" | "info" | "muted";

const toneStyles: Record<Tone, string> = {
  success: "border-transparent bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  warning: "border-transparent bg-amber-500/15 text-amber-600 dark:text-amber-400",
  danger: "border-transparent bg-rose-500/15 text-rose-600 dark:text-rose-400",
  info: "border-transparent bg-violet-500/15 text-violet-600 dark:text-violet-400",
  neutral: "border-transparent bg-slate-500/15 text-slate-600 dark:text-slate-300",
  muted: "border-transparent bg-muted text-muted-foreground",
};

export function StatusPill({ status, tone, className }: { status: string; tone?: Tone; className?: string }) {
  const toneKey = tone ?? toneFor(status);
  return (
    <Badge variant="outline" className={cn(toneStyles[toneKey], "capitalize", className)}>
      {status}
    </Badge>
  );
}

function toneFor(status: string): Tone {
  const s = status.toLowerCase();
  if (["completed", "success", "approved", "ready", "active", "healthy", "ok", "connected"].includes(s)) return "success";
  if (["running", "pending", "processing", "scheduled", "queued", "uploading", "warning", "partial"].includes(s)) return "warning";
  if (["failed", "error", "rejected", "timed_out", "disabled", "offline", "critical"].includes(s)) return "danger";
  if (["waiting", "idle", "paused", "review"].includes(s)) return "muted";
  return "info";
}

export { toneFor };