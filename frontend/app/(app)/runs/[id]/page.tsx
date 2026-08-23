"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Loader2, XCircle, Circle, Zap, Wrench, Clock, Coins, Play } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusPill } from "@/components/shared/StatusPill";
import { Markdown } from "@/components/chat/Markdown";
import { formatCost, formatDate, formatDuration, formatTime, formatTokens } from "@/lib/format";
import type { AgentRun } from "@/types";

function StepIcon({ status }: { status: string }) {
  if (status === "completed") return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
  if (status === "running") return <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-500" />;
  if (status === "failed") return <XCircle className="h-3.5 w-3.5 text-destructive" />;
  return <Circle className="h-3.5 w-3.5 text-muted-foreground" />;
}

export default function RunDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: run, isLoading, isError } = useQuery<AgentRun>({
    queryKey: ["run", params.id],
    queryFn: () => api.get(`/api/runs/${params.id}`),
  });

  const nodes = run?.steps ?? [];

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <Button variant="ghost" size="sm" onClick={() => router.push("/runs")} className="-ml-2 text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> All runs
      </Button>

      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      )}
      {isError && <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">Failed to load this run.</div>}

      {run && (
        <>
          <PageHeader
            eyebrow="Execution Detail"
            title={run.input || "Run detail"}
            description={
              <>
                <span className="font-mono text-xs">{run.id}</span>
              </>
            }
            actions={<StatusPill status={run.status} />}
          />

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { label: "Started", value: formatDate(run.created_at), icon: Clock },
              { label: "Duration", value: formatDuration(run.duration_ms), icon: Play },
              { label: "Model", value: run.model || "auto", icon: Zap },
              { label: "Tokens", value: formatTokens(run.tokens), icon: Coins },
              { label: "Cost", value: formatCost(run.cost), icon: Coins },
              { label: "Tools", value: String(run.tools_used?.length || 0), icon: Wrench },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border bg-card p-3">
                <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                  <item.icon className="h-3 w-3" /> {item.label}
                </p>
                <p className="mt-1 truncate text-sm font-semibold">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Execution Graph</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex w-full max-w-xs items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-100 text-violet-600">
                        <Zap className="h-3.5 w-3.5" />
                      </span>
                      <span className="text-xs font-semibold">Goal</span>
                    </div>
                    {nodes.length > 0 && (
                      <>
                        <span className="h-3 w-px bg-violet-300" />
                        {nodes.map((step, i) => (
                          <div key={i} className="flex w-full max-w-xs flex-col items-center">
                            <div className="flex w-full items-center gap-2 rounded-lg border px-3 py-2">
                              <StepIcon status={step.status} />
                              <span className="text-xs font-medium capitalize">{step.name}</span>
                              <span className="ml-auto font-mono text-[10px] text-muted-foreground">{formatTime(run.created_at)}</span>
                            </div>
                            {i < nodes.length - 1 && <span className="h-2.5 w-px bg-violet-300" />}
                          </div>
                        ))}
                      </>
                    )}
                    <span className="h-3 w-px bg-violet-300" />
                    <div className="flex w-full max-w-xs items-center gap-2 rounded-lg border px-3 py-2">
                      <StepIcon status={run.status === "failed" ? "failed" : "completed"} />
                      <span className="text-xs font-medium">{run.status === "failed" ? "Run failed" : "Final result"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6 lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Input</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm">{run.input}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Execution Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  {nodes.length > 0 ? (
                    <ol className="relative space-y-4 border-l pl-5">
                      <li className="relative">
                        <span className="absolute -left-[26px] flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/20">
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        </span>
                        <p className="text-sm font-medium">Run started</p>
                        <p className="text-xs text-muted-foreground">{formatTime(run.created_at)}</p>
                      </li>
                      {nodes.map((step, i) => (
                        <li key={i} className="relative">
                          <span className="absolute -left-[26px] flex h-4 w-4 items-center justify-center rounded-full bg-muted">
                            <StepIcon status={step.status} />
                          </span>
                          <p className="text-sm font-medium capitalize">{step.name}</p>
                          {step.detail && <p className="text-xs text-muted-foreground">{step.detail}</p>}
                        </li>
                      ))}
                      <li className="relative">
                        <span className="absolute -left-[26px] flex h-4 w-4 items-center justify-center rounded-full bg-muted">
                          <StepIcon status={run.status === "failed" ? "failed" : "completed"} />
                        </span>
                        <p className="text-sm font-medium capitalize">{run.status === "failed" ? "Run failed" : "Run completed"}</p>
                        {run.error && <p className="mt-1 rounded-md border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive">{run.error}</p>}
                      </li>
                    </ol>
                  ) : (
                    <p className="text-sm text-muted-foreground">No steps recorded for this run.</p>
                  )}
                </CardContent>
              </Card>

              {run.result && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Final Result</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Markdown content={run.result} />
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}