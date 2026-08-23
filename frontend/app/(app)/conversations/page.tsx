"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessagesSquare, MessageSquarePlus, Trash2, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/format";
import type { Conversation } from "@/types";

export default function ConversationsPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery<Conversation[]>({
    queryKey: ["conversations"],
    queryFn: () => api.get("/api/conversations"),
  });

  const del = async (id: number) => {
    if (!confirm("Delete this conversation permanently?")) return;
    try {
      await api.del(`/api/conversations/${id}`);
      qc.setQueryData<Conversation[]>(["conversations"], (old) => (old || []).filter((c) => c.id !== id));
    } catch {}
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Conversations</h1>
          <p className="text-sm text-muted-foreground">Your chat history across all agents.</p>
        </div>
        <Button onClick={() => router.push("/chat")}>
          <MessageSquarePlus className="h-4 w-4" /> New Chat
        </Button>
      </div>

      {isError && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load conversations.{" "}
          <button className="underline" onClick={() => refetch()}>
            Retry
          </button>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : (data?.length ?? 0) === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <MessagesSquare className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No conversations yet.</p>
              <Button variant="outline" onClick={() => router.push("/chat")}>
                Start a chat
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {data?.map((c) => (
                <div key={c.id} className="group flex items-center justify-between px-4 py-3 transition-colors hover:bg-muted/50">
                  <Link href={`/chat/${c.id}`} className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{c.title || "Untitled"}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(c.updated_at)} · {c.model === "default" ? "auto" : c.model}
                    </p>
                  </Link>
                  <div className="flex items-center gap-2">
                    {c.status === "running" && <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-500" />}
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" onClick={() => del(c.id)} aria-label="Delete conversation">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}