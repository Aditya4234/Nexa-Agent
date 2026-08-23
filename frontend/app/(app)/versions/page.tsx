"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Boxes, GitBranch, ArrowUpRight, RotateCcw, Check, Sparkles, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusPill } from "@/components/shared/StatusPill";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const VERSIONS = [
  { version: "v2.0", agent: "Research Agent", date: "Aug 18, 2026", status: "live", changes: { prompt: "Updated", tools: "+2", memory: "Updated", model: "Changed", performance: "+8.4%" }, note: "Added browser tool and reranking." },
  { version: "v1.2", agent: "Research Agent", date: "Jul 30, 2026", status: "previous", changes: { prompt: "Tweaked", tools: "+1", memory: "—", model: "Same", performance: "+2.1%" }, note: "Improved citation formatting." },
  { version: "v1.1", agent: "Research Agent", date: "Jul 12, 2026", status: "archived", changes: { prompt: "—", tools: "—", memory: "—", model: "Same", performance: "-1.2%" }, note: "Fixed web search fallback." },
  { version: "v1.0", agent: "Research Agent", date: "Jun 20, 2026", status: "archived", changes: { prompt: "Initial", tools: "—", memory: "Initial", model: "Initial", performance: "—" }, note: "First production release." },
];

export default function VersionsPage() {
  const [live, setLive] = useState("v2.0");

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <PageHeader
        eyebrow="Release Management"
        title="Agent Versions"
        description="Version, deploy and roll back your agents with a full changelog."
      />

      <div className="space-y-4">
        {VERSIONS.map((v, i) => {
          const isLive = v.version === live;
          return (
            <motion.div
              key={v.version}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.3 }}
            >
              <Card className={cn("transition-all", isLive && "border-violet-300 ring-1 ring-violet-200")}>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", isLive ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white" : "bg-muted text-muted-foreground")}>
                        <Boxes className="h-5 w-5" />
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="font-mono text-base">{v.version}</CardTitle>
                          <StatusPill status={isLive ? "live" : v.status} />
                        </div>
                        <CardDescription>{v.agent} · {v.date}</CardDescription>
                      </div>
                    </div>
                    {!isLive && (
                      <Button size="sm" variant="outline" onClick={() => setLive(v.version)}>
                        <GitBranch className="h-3.5 w-3.5" /> Deploy
                      </Button>
                    )}
                    {isLive && (
                      <Badge className="gap-1 bg-emerald-500/15 text-emerald-600">
                        <Check className="h-3 w-3" /> Currently live
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                    {Object.entries(v.changes).map(([key, val]) => (
                      <div key={key} className="rounded-lg border bg-muted/30 p-2.5">
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{key}</p>
                        <p className={cn("mt-0.5 text-sm font-medium", val.startsWith("+") && "text-emerald-600", val.startsWith("-") && "text-rose-600")}>
                          {val}
                        </p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Sparkles className="h-3 w-3 text-violet-500" /> {v.note}
                  </p>
                  {isLive && (
                    <p className="mt-3 flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-700">
                      <AlertTriangle className="h-3.5 w-3.5" /> Deployments affect all agents using this version. Monitor runs after promotion.
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <RotateCcw className="h-4 w-4" /> Rollback
          </CardTitle>
          <CardDescription>Instantly revert any agent to a previous stable version.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Badge variant="outline" className="font-mono">Research Agent · {live}</Badge>
          <Button variant="outline" size="sm" className="gap-1.5">
            <ArrowUpRight className="h-3.5 w-3.5" /> Compare v1.2 → v2.0
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}