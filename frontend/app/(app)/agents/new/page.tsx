"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { AgentForm } from "@/components/agents/AgentForm";
import { Skeleton } from "@/components/ui/skeleton";
import type { AgentTemplate } from "@/types";

export default function NewAgentPage() {
  const searchParams = useSearchParams();
  const templateId = searchParams.get("template");

  const { data: templates } = useQuery<AgentTemplate[]>({
    queryKey: ["agent-templates"],
    queryFn: () => api.get("/api/agents/templates"),
    enabled: !!templateId,
  });
  const template = templates?.find((t) => t.id === templateId);

  if (templateId && !template) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">
        {template ? `Create ${template.name}` : "Create a new agent"}
      </h1>
      <AgentForm template={template} />
    </div>
  );
}