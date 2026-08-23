import type { LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  hint?: string;
  loading?: boolean;
  accent?: string;
  trend?: { dir: "up" | "down"; text: string; positive?: boolean };
}

export function MetricCard({ label, value, icon: Icon, hint, loading, accent, trend }: MetricCardProps) {
  return (
    <div className="group rounded-xl border bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            {loading ? (
              <Skeleton className="mt-1 h-8 w-20" />
            ) : (
              <p className="mt-0.5 text-2xl font-semibold tracking-tight">{value}</p>
            )}
            {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
          </div>
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-black/5 transition-colors group-hover:scale-105",
              accent ?? "bg-primary/10 text-primary"
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
        {trend && (
          <p
            className={cn(
              "mt-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
              trend.positive === false ? "bg-rose-500/10 text-rose-600" : "bg-emerald-500/10 text-emerald-600"
            )}
          >
            {trend.dir === "up" ? "↑" : "↓"} {trend.text}
          </p>
        )}
      </div>
    </div>
  );
}