"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Bot, Plus, Loader2, Puzzle, Store, Star, Users, Play, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusPill } from "@/components/shared/StatusPill";
import type { Agent, AgentTemplate } from "@/types";

const marketplaceAgents = [
  { name: "SEO Agent", icon: "🔍", desc: "Audits pages, finds keywords and suggests on-page improvements.", rating: 4.8, runs: "18.2K", users: "3.1K", tools: ["web_search", "browser", "crawler"], category: "Marketing" },
  { name: "Financial Analyst", icon: "📈", desc: "Analyzes statements, flags risks and generates forecasts.", rating: 4.9, runs: "9.4K", users: "1.8K", tools: ["python", "sql", "files"], category: "Finance" },
  { name: "Customer Support", icon: "🎧", desc: "Answers product questions from your docs and knowledge base.", rating: 4.7, runs: "24.1K", users: "5.6K", tools: ["rag", "web_search"], category: "Productivity" },
  { name: "DevOps Agent", icon: "🛠", desc: "Triages issues, checks deployments and drafts runbooks.", rating: 4.6, runs: "6.8K", users: "1.2K", tools: ["github", "code_execution", "slack"], category: "Developer Tools" },
];

export default function AgentsPage() {
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("tab") === "templates" ? "templates" : "agents";

  const { data: agents, isLoading, isError, refetch } = useQuery<Agent[]>({ queryKey: ["agents"], queryFn: () => api.get("/api/agents") });
  const { data: templates } = useQuery<AgentTemplate[]>({ queryKey: ["agent-templates"], queryFn: () => api.get("/api/agents/templates") });

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <PageHeader
        eyebrow="Agentic Workforce"
        title="Agents"
        description="Create, configure and manage your autonomous agents."
        actions={
          <Link href="/agents/new" className="inline-flex h-9 items-center gap-2 rounded-md bg-gradient-to-r from-violet-600 to-indigo-600 px-4 text-sm font-medium text-white shadow-md shadow-violet-600/20">
            <Plus className="h-4 w-4" /> Create Agent
          </Link>
        }
      />

      <Tabs defaultValue={defaultTab}>
        <TabsList>
          <TabsTrigger value="agents">My Agents</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
        </TabsList>

        <TabsContent value="agents" className="space-y-4">
          {isError && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
              Failed to load agents.{" "}
              <button className="underline" onClick={() => refetch()}>
                Retry
              </button>
            </div>
          )}
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-44 w-full" />
              ))}
            </div>
          ) : (agents?.length ?? 0) === 0 ? (
            <EmptyState
              icon={Bot}
              title="No custom agents yet"
              description="Start from a template or build your own from scratch."
              action={
                <Link href="/agents?tab=templates">
                  <Button variant="outline">Browse templates</Button>
                </Link>
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {agents?.map((a) => (
                <Link key={a.id} href={`/agents/${a.id}`} className="group">
                  <Card className="h-full transition-all group-hover:-translate-y-0.5 group-hover:border-primary/50 group-hover:shadow-lg group-hover:shadow-violet-900/10">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-50 to-indigo-50 text-2xl ring-1 ring-violet-100">
                          {a.icon}
                        </div>
                        <StatusPill status={a.is_system ? "system" : "custom"} tone={a.is_system ? "info" : "neutral"} />
                      </div>
                      <CardTitle className="pt-2 text-base">{a.name}</CardTitle>
                      <CardDescription className="line-clamp-2">{a.description || "No description"}</CardDescription>
                    </CardHeader>
                    <CardFooter className="flex flex-wrap gap-1.5 pt-0">
                      {a.tools.slice(0, 3).map((t) => (
                        <Badge key={t} variant="outline" className="text-[10px]">
                          {t}
                        </Badge>
                      ))}
                      {a.tools.length > 3 && <span className="text-[10px] text-muted-foreground">+{a.tools.length - 3}</span>}
                      <span className="ml-auto text-xs text-muted-foreground">{a.model === "default" ? "auto" : a.model}</span>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="templates">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {templates?.map((t) => (
              <Card key={t.id} className="flex h-full flex-col transition-all hover:-translate-y-0.5 hover:shadow-lg">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-50 to-indigo-50 text-2xl ring-1 ring-violet-100">
                      {t.icon}
                    </div>
                    <Puzzle className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <CardTitle className="pt-2 text-base">{t.name}</CardTitle>
                  <CardDescription className="line-clamp-3">{t.description}</CardDescription>
                </CardHeader>
                <CardFooter className="mt-auto flex flex-wrap items-center gap-1.5 pt-0">
                  {t.tools.slice(0, 3).map((tool) => (
                    <Badge key={tool} variant="outline" className="text-[10px]">
                      {tool}
                    </Badge>
                  ))}
                  <Link href={`/agents/new?template=${t.id}`} className="ml-auto">
                    <Button size="sm" variant="outline" className="group/btn gap-1">
                      Use template <ArrowRight className="h-3 w-3 transition-transform group-hover/btn:translate-x-0.5" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="marketplace">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
              <Store className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold">Agent Marketplace</p>
              <p className="text-xs text-muted-foreground">Ready-to-run agents from the community and NexaAgent team.</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
            {marketplaceAgents.map((a) => (
              <Card key={a.name} className="flex flex-col transition-all hover:-translate-y-0.5 hover:shadow-lg">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-50 to-indigo-50 text-2xl ring-1 ring-violet-100">
                      {a.icon}
                    </div>
                    <Badge variant="outline">{a.category}</Badge>
                  </div>
                  <CardTitle className="pt-2 text-base">{a.name}</CardTitle>
                  <CardDescription className="line-clamp-2">{a.desc}</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1 font-medium text-amber-600">
                    <Star className="h-3.5 w-3.5 fill-current" /> {a.rating.toFixed(1)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Play className="h-3 w-3" /> {a.runs} runs
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3 w-3" /> {a.users} users
                  </span>
                </CardContent>
                <CardFooter className="mt-auto flex flex-wrap items-center gap-1.5 pt-0">
                  {a.tools.slice(0, 3).map((t) => (
                    <Badge key={t} variant="outline" className="text-[10px]">
                      {t}
                    </Badge>
                  ))}
                  <Link href={`/agents/new?template=${a.name.toLowerCase().replace(/ /g, "-")}`} className="ml-auto">
                    <Button size="sm" className="bg-gradient-to-r from-violet-600 to-indigo-600 shadow-md shadow-violet-600/20">
                      Use Agent
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}