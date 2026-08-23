"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Bot, Info, RefreshCw, ScrollText, ThumbsUp } from "lucide-react";

import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { LogEntry } from "@/types";

const SOURCE_ICON: Record<string, typeof Info> = {
  agent_run: Bot,
  tool: AlertCircle,
  feedback: ThumbsUp,
};

export default function LogsPage() {
  const { data, isLoading, isError, refetch, isFetching } = useQuery<{ entries: LogEntry[] }>({
    queryKey: ["logs"],
    queryFn: () => api.get("/api/logs"),
    refetchInterval: 10000,
  });

  const entries = data?.entries ?? [];

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Logs</h1>
          <p className="text-sm text-muted-foreground">A unified audit trail of runs, tool calls, and feedback.</p>
        </div>
        <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={cn("h-4 w-4 mr-1", isFetching && "animate-spin")} /> Refresh
        </Button>
      </div>

      {isError && (
        <div className="flex items-center justify-between rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          Failed to load logs.
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <ScrollText className="h-4 w-4" /> Recent activity
            <Badge variant="secondary" className="ml-1">
              {entries.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : entries.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">No activity yet.</p>
          ) : (
            <div className="divide-y">
              {entries.map((e) => {
                const Icon = SOURCE_ICON[e.source] || Info;
                return (
                  <div key={e.id} className="flex items-start gap-3 px-4 py-3">
                    <div
                      className={cn(
                        "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border",
                        e.level === "error" ? "border-destructive/30 bg-destructive/10 text-destructive" : "border-border bg-muted text-muted-foreground"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium">{e.message}</span>
                        <Badge variant={e.level === "error" ? "destructive" : "secondary"} className="capitalize">
                          {e.level}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {e.source}
                        </Badge>
                      </div>
                      {e.detail && <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{e.detail}</p>}
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">{formatTime(e.created_at)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}