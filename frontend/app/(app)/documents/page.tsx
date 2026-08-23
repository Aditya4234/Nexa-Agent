"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Plus, Trash2, Clock } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/format";
import type { Document } from "@/types";

export default function DocumentsPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery<Document[]>({
    queryKey: ["documents"],
    queryFn: () => api.get("/api/documents"),
  });

  const del = async (id: number) => {
    if (!confirm("Delete this document permanently?")) return;
    try {
      await api.del(`/api/documents/${id}`);
      qc.setQueryData<Document[]>(["documents"], (old) => (old || []).filter((d) => d.id !== id));
    } catch {}
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Documents</h1>
          <p className="text-sm text-muted-foreground">Create, edit, and manage your markdown documents.</p>
        </div>
        <Button onClick={() => router.push("/documents/new")}>
          <Plus className="h-4 w-4" /> New Document
        </Button>
      </div>

      {isError && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load documents.{" "}
          <button className="underline" onClick={() => refetch()}>
            Retry
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full" />
          ))}
        </div>
      ) : (data?.length ?? 0) === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <FileText className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No documents yet.</p>
          <Button variant="outline" onClick={() => router.push("/documents/new")}>
            Create your first document
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data?.map((doc) => (
            <div key={doc.id} className="group relative">
              <Link href={`/documents/${doc.id}`}>
                <Card className="h-full transition-all group-hover:border-primary/50">
                  <CardContent className="flex h-full flex-col p-5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <FileText className="h-4.5 w-4.5" />
                    </div>
                    <h3 className="mt-3 truncate text-sm font-semibold">{doc.title}</h3>
                    <p className="mt-1 line-clamp-3 flex-1 text-xs text-muted-foreground">
                      {doc.content.trim() ? doc.content.trim().slice(0, 120) : "Empty document"}
                    </p>
                    <p className="mt-3 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Clock className="h-3 w-3" /> Updated {formatDate(doc.updated_at)}
                    </p>
                  </CardContent>
                </Card>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2 h-7 w-7 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                onClick={() => del(doc.id)}
                aria-label="Delete document"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}