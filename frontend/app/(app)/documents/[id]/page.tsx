"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Save, Trash2, Eye, Pencil, Columns2 } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Markdown } from "@/components/chat/Markdown";
import { cn } from "@/lib/utils";
import type { Document } from "@/types";

type View = "edit" | "preview" | "split";

const DEFAULT_CONTENT = "# New document\n\nStart writing in **markdown**. Use `#` for headings, `` `code` `` for inline code, and fenced blocks for code samples.\n\n```python\ndef hello():\n    return \"Hello, NexaAgent!\"\n```\n";

export default function DocumentEditorPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const id = Number(params.id);
  const isNew = !id;

  const { data: doc, isLoading, isError } = useQuery<Document>({
    queryKey: ["document", id],
    queryFn: () => api.get(`/api/documents/${id}`),
    enabled: !isNew,
  });

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [view, setView] = useState<View>("edit");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [error, setError] = useState("");
  const loadedRef = useRef(false);

  useEffect(() => {
    if (doc && !loadedRef.current) {
      loadedRef.current = true;
      setTitle(doc.title);
      setContent(doc.content);
    }
  }, [doc]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        save();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const save = async () => {
    if (!title.trim()) {
      setError("Title cannot be empty.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      if (isNew) {
        const created = await api.post<Document>("/api/documents", { title, content });
        loadedRef.current = true;
        router.replace(`/documents/${created.id}`);
      } else {
        await api.put(`/api/documents/${id}`, { title, content });
      }
      qc.invalidateQueries({ queryKey: ["documents"] });
      setDirty(false);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1500);
    } catch (err: any) {
      setError(err?.detail?.message || err?.message || "Failed to save document.");
    } finally {
      setSaving(false);
    }
  };

  const del = async () => {
    if (!confirm("Delete this document permanently?")) return;
    await api.del(`/api/documents/${id}`);
    qc.invalidateQueries({ queryKey: ["documents"] });
    router.push("/documents");
  };

  if (!isNew && isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 p-4 sm:p-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }
  if (!isNew && isError) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">Failed to load this document.</div>
      </div>
    );
  }

  const showEditor = view === "edit" || view === "split";
  const showPreview = view === "preview" || view === "split";

  return (
    <div className="flex h-full flex-col">
      <div className="mx-auto w-full max-w-5xl flex-1 space-y-4 p-4 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => router.push("/documents")} className="-ml-2 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" /> Documents
          </Button>
          <div className="ml-auto flex items-center gap-2">
            {savedFlash && <span className="text-xs text-emerald-600 dark:text-emerald-400">Saved</span>}
            {dirty && <span className="text-xs text-muted-foreground">Unsaved changes</span>}
            {!isNew && (
              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={del}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <Button size="sm" onClick={save} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isNew ? "Create" : "Save"}
              <kbd className="ml-1 hidden rounded border bg-background/20 px-1 text-[10px] sm:inline">⌘S</kbd>
            </Button>
          </div>
        </div>

        {error && <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}

        <div className="flex items-center gap-3">
          <Input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setDirty(true);
            }}
            placeholder="Document title"
            className="h-10 border-0 bg-transparent px-0 text-xl font-semibold tracking-tight shadow-none focus-visible:ring-0"
          />
        </div>

        <div className="flex items-center gap-1 rounded-lg border bg-muted/40 p-0.5 w-fit">
          {(
            [
              { id: "edit", label: "Edit", icon: Pencil },
              { id: "preview", label: "Preview", icon: Eye },
              { id: "split", label: "Split", icon: Columns2 },
            ] as const
          ).map(({ id: v, label, icon: Icon }) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                view === v ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>

        <div className={cn("grid gap-4", view === "split" && "grid-cols-2")}>
          {showEditor && (
            <textarea
              value={isNew ? content || DEFAULT_CONTENT : content}
              onChange={(e) => {
                setContent(e.target.value);
                setDirty(true);
              }}
              spellCheck={false}
              placeholder="# Write in markdown…"
              className={cn(
                "min-h-[50vh] w-full resize-none rounded-lg border bg-card p-4 font-mono text-sm leading-relaxed outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30",
                view === "split" && "min-h-[60vh]"
              )}
            />
          )}
          {showPreview && (
            <div className={cn("min-h-[50vh] w-full rounded-lg border bg-card p-4", view === "split" && "min-h-[60vh] overflow-y-auto")}>
              {(isNew ? content || DEFAULT_CONTENT : content) ? (
                <Markdown content={isNew ? content || DEFAULT_CONTENT : content} />
              ) : (
                <p className="text-sm text-muted-foreground">Nothing to preview yet.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}