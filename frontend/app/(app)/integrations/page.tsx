"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plug, ShieldCheck, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Plugin } from "@/types";

export default function IntegrationsPage() {
  const qc = useQueryClient();
  const { data: plugins, isLoading, isError, refetch } = useQuery<Plugin[]>({
    queryKey: ["plugins"],
    queryFn: () => api.get("/api/plugins"),
  });

  const toggle = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => api.put<Plugin>(`/api/plugins/${id}`, { enabled }),
    onMutate: async ({ id, enabled }) => {
      await qc.cancelQueries({ queryKey: ["plugins"] });
      const previous = qc.getQueryData<Plugin[]>(["plugins"]);
      qc.setQueryData<Plugin[]>(["plugins"], (old) => (old || []).map((p) => (p.id === id ? { ...p, enabled } : p)));
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(["plugins"], ctx.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["plugins"] }),
  });

  const categories = Array.from(new Set((plugins ?? []).map((p) => p.category)));
  const enabledCount = (plugins ?? []).filter((p) => p.enabled).length;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Integrations</h1>
        <p className="text-sm text-muted-foreground">
          Connect external apps so agents can use them in chat. {enabledCount} of {(plugins ?? []).length} enabled.
        </p>
      </div>

      {isError && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load integrations.{" "}
          <button className="underline" onClick={() => refetch()}>
            Retry
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full" />
          ))}
        </div>
      ) : (
        categories.map((category) => (
          <section key={category} className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{category}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {plugins
                ?.filter((p) => p.category === category)
                .map((p) => {
                  const pending = toggle.isPending && toggle.variables?.id === p.id;
                  return (
                    <Card key={p.id} className={cn("transition-colors", p.enabled && "border-primary/40")}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-xl">{p.icon}</div>
                          <Switch
                            checked={p.enabled}
                            onCheckedChange={(v) => toggle.mutate({ id: p.id, enabled: v })}
                            disabled={pending}
                            aria-label={`Toggle ${p.name}`}
                          />
                        </div>
                        <div className="flex items-center gap-2 pt-2">
                          <h3 className="text-base font-semibold">{p.name}</h3>
                          {pending && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2.5">
                        <p className="text-sm text-muted-foreground">{p.description}</p>
                        <div className="flex flex-wrap gap-1.5">
                          <Badge variant="outline" className="text-[10px]">
                            {p.scopes.length} scopes
                          </Badge>
                          {p.requires_approval && (
                            <Badge variant="warning" className="gap-1 text-[10px]">
                              <ShieldCheck className="h-3 w-3" /> Writes need approval
                            </Badge>
                          )}
                          <Badge variant={p.connected ? "success" : "muted"} className="text-[10px]">
                            {p.connected ? "Connected" : "Configured via key"}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          </section>
        ))
      )}

      {(plugins ?? []).length === 0 && !isLoading && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <Plug className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No integrations registered on the server.</p>
        </div>
      )}
    </div>
  );
}