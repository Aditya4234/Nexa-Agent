import { cn } from "@/lib/utils";

export function AuthDivider({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)} role="separator" aria-label={typeof children === "string" ? children : undefined}>
      <span className="h-px flex-1 bg-border" aria-hidden />
      <span className="select-none text-xs font-medium tracking-wide text-muted-foreground">{children}</span>
      <span className="h-px flex-1 bg-border" aria-hidden />
    </div>
  );
}
