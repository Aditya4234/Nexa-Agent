"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { AgentForm } from "@/components/agents/AgentForm";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import type { Agent } from "@/types";

export default function EditAgentPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const id = Number(params.id);

  const { data: agents, isLoading } = useQuery<Agent[]>({ queryKey: ["agents"], queryFn: () => api.get("/api/agents") });
  const agent = agents?.find((a) => a.id === id);

  const del = async () => {
    if (!confirm("Delete this agent? This cannot be undone.")) return;
    await api.del(`/api/agents/${id}`);
    qc.invalidateQueries({ queryKey: ["agents"] });
    router.push("/agents");
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (!agent) {
    return <div className="p-6 text-sm text-muted-foreground">Agent not found.</div>;
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Edit · {agent.name}</h1>
        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={del}>
          <Trash2 className="h-4 w-4" /> Delete
        </Button>
      </div>
      <AgentForm agent={agent} />
    </div>
  );
}