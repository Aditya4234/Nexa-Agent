interface Props {
  value: number;
  size?: number;
}

export function SuccessRing({ value, size = 120 }: Props) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(Math.max(value, 0), 100);
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="flex items-center gap-6">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox="0 0 100 100" className="-rotate-90">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="9" />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={clamped >= 90 ? "#10b981" : clamped >= 60 ? "hsl(var(--primary))" : "#f59e0b"}
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold">{clamped.toFixed(1)}%</span>
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">success</span>
        </div>
      </div>
    </div>
  );
}