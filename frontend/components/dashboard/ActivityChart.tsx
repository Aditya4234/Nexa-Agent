interface ActivityPoint {
  date: string;
  messages: number;
}

export function ActivityChart({ data }: { data: ActivityPoint[] }) {
  if (!data || data.length === 0) {
    return <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">No activity yet</div>;
  }

  const w = 640;
  const h = 200;
  const pad = 30;
  const max = Math.max(...data.map((d) => d.messages), 1);
  const stepX = (w - pad * 2) / (data.length - 1 || 1);

  const points = data.map((d, i) => ({
    x: pad + i * stepX,
    y: h - pad - (d.messages / max) * (h - pad * 2),
    d,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaPath = `${linePath} L${points[points.length - 1].x},${h - pad} L${points[0].x},${h - pad} Z`;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${w} ${h}`} className="h-48 w-full" preserveAspectRatio="none" role="img" aria-label="Daily activity chart">
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line key={f} x1={pad} x2={w - pad} y1={h - pad - f * (h - pad * 2)} y2={h - pad - f * (h - pad * 2)} stroke="hsl(var(--border))" strokeWidth="1" strokeDasharray="4 4" />
        ))}
        <path d={areaPath} fill="url(#areaFill)" />
        <path d={linePath} fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p) => (
          <circle key={p.d.date} cx={p.x} cy={p.y} r="3.5" fill="hsl(var(--primary))">
            <title>{`${p.d.date}: ${p.d.messages} messages`}</title>
          </circle>
        ))}
      </svg>
      <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
        {points.map((p) => (
          <span key={p.d.date}>{new Date(p.d.date + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
        ))}
      </div>
    </div>
  );
}