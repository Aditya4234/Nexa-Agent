"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, ShieldCheck, Timer, XCircle, Mail, Trash2, Database, Wallet, Rocket, Globe, Pencil } from "lucide-react";

import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/PageHeader";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Approval } from "@/types";

const STATUS_VARIANT: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-amber-500/10 text-amber-600" },
  approved: { label: "Approved", className: "bg-emerald-500/10 text-emerald-600" },
  rejected: { label: "Rejected", className: "bg-destructive/10 text-destructive" },
  timed_out: { label: "Timed out", className: "bg-muted text-muted-foreground" },
};

const CATEGORY_META: Record<string, { icon: typeof Globe; label: string; cls: string }> = {
  tool: { icon: ShieldCheck, label: "Tool access", cls: "bg-violet-100 text-violet-600" },
  external: { icon: Mail, label: "External communication", cls: "bg-sky-100 text-sky-600" },
  delete: { icon: Trash2, label: "File deletion", cls: "bg-rose-100 text-rose-600" },
  database: { icon: Database, label: "Database modification", cls: "bg-amber-100 text-amber-600" },
  financial: { icon: Wallet, label: "Financial action", cls: "bg-emerald-100 text-emerald-600" },
  production: { icon: Rocket, label: "Production deployment", cls: "bg-indigo-100 text-indigo-600" },
};

function categoryFor(toolId: string): keyof typeof CATEGORY_META {
  const t = toolId.toLowerCase();
  if (t.includes("email") || t.includes("slack") || t.includes("send")) return "external";
  if (t.includes("delete") || t.includes("remove")) return "delete";
  if (t.includes("db") || t.includes("database") || t.includes("sql") || t.includes("mongo")) return "database";
  if (t.includes("payment") || t.includes("charge") || t.includes("invoice")) return "financial";
  if (t.includes("deploy") || t.includes("production")) return "production";
  return "tool";
}

export default function ApprovalsPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState("pending");
  const { data, isLoading } = useQuery<Approval[]>({
    queryKey: ["approvals", tab],
    queryFn: () => api.get(tab === "pending" ? "/api/approvals/pending" : "/api/approvals"),
  });
  const [busy, setBusy] = useState<number | null>(null);

  async function decide(a: Approval, decision: "approve" | "reject") {
    setBusy(a.id);
    try {
      await api.post(`/api/approvals/${a.id}/decide`, { decision });
      qc.invalidateQueries({ queryKey: ["approvals"] });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <PageHeader
        eyebrow="Human-in-the-Loop"
        title="Approvals"
        description="Review and approve sensitive agent actions before they execute."
        actions={
          <Badge variant="outline" className="gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
            </span>
            {data?.filter((a) => a.status === "pending").length ?? 0} waiting
          </Badge>
        }
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (data ?? []).length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <ShieldCheck className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium">No {tab === "pending" ? "pending " : ""}approvals</p>
          <p className="mt-1 text-sm text-muted-foreground">When an agent wants to run a sensitive action, it will appear here for your review.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(data ?? []).map((a) => {
            const variant = STATUS_VARIANT[a.status] || STATUS_VARIANT.pending;
            const cat = CATEGORY_META[categoryFor(a.tool_id)] || CATEGORY_META.tool;
            const CatIcon = cat.icon;
            return (
              <Card key={a.id}>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={cn("capitalize", variant.className)}>{variant.label}</Badge>
                      <Badge variant="outline" className="font-mono">{a.tool_id}</Badge>
                      <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium", cat.cls)}>
                        <CatIcon className="h-3 w-3" /> {cat.label}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatTime(a.created_at)}</span>
                  </div>
                  <CardTitle className="mt-2 text-base">{a.reason || `Run ${a.tool_id}`}</CardTitle>
                  <CardDescription>Run {a.run_id.slice(0, 8)}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.keys(a.args || {}).length > 0 && (
                    <pre className="whitespace-pre-wrap rounded-md bg-muted p-3 font-mono text-xs text-muted-foreground">
                      {JSON.stringify(a.args, null, 2)}
                    </pre>
                  )}
                  {a.status === "pending" && (
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => decide(a, "approve")} disabled={busy === a.id} className="bg-emerald-600 hover:bg-emerald-700">
                        {busy === a.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => decide(a, "reject")} disabled={busy === a.id} className="text-destructive hover:text-destructive">
                        <XCircle className="h-3.5 w-3.5" /> Reject
                      </Button>
                      <Button size="sm" variant="outline" disabled={busy === a.id}>
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </Button>
                    </div>
                  )}
                  {a.status === "timed_out" && (
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Timer className="h-3.5 w-3.5" /> This request expired before a decision was made.
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}