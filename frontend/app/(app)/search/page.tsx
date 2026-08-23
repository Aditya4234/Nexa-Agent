"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, FileText, Filter, SlidersHorizontal, Loader2, Database, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatBytes } from "@/lib/format";
import type { KnowledgeSearchResult, KnowledgeDoc } from "@/types";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<KnowledgeSearchResult[] | null>(null);
  const [mode, setMode] = useState<string | null>(null);
  const [k, setK] = useState(6);
  const [error, setError] = useState("");
  const { data: docs } = useQuery<KnowledgeDoc[]>({ queryKey: ["knowledge"], queryFn: () => api.get("/api/knowledge") });

  const run = async () => {
    if (!query.trim() || searching) return;
    setSearching(true);
    setError("");
    try {
      const res = await api.post<{ results: KnowledgeSearchResult[]; mode: string }>("/api/knowledge/search", { query: query.trim(), k });
      setResults(res.results);
      setMode(res.mode);
    } catch (err: any) {
      setError(err?.detail?.message || err?.message || "Search failed.");
      setResults(null);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <PageHeader
        eyebrow="Knowledge Retrieval"
        title="Vector Search"
        description="Semantic and hybrid search over your documents, embeddings and knowledge bases."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Search your knowledge</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && run()}
                placeholder="e.g. What pricing model do our competitors use?"
                className="h-11 pl-9 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-lg border px-3 py-2.5 text-sm">
                <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                <select value={k} onChange={(e) => setK(Number(e.target.value))} className="bg-transparent text-sm outline-none">
                  {[4, 6, 8, 10].map((n) => (
                    <option key={n} value={n}>
                      top-{n}
                    </option>
                  ))}
                </select>
              </div>
              <Button onClick={run} disabled={searching || !query.trim()} className="bg-gradient-to-r from-violet-600 to-indigo-600 shadow-md shadow-violet-600/20">
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Search
              </Button>
            </div>
          </div>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {results ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Results</CardTitle>
                  <Badge variant="outline" className="font-mono">{mode === "embedding" ? "semantic embeddings" : mode === "hybrid" ? "hybrid (semantic + keyword)" : "keyword"}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {results.length === 0 ? (
                  <EmptyState icon={Search} title="No results" description="Nothing matched your query." />
                ) : (
                  results.map((r, i) => (
                    <div key={i} className="rounded-lg border bg-muted/30 p-4">
                      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
                        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-100 text-violet-600">
                          <FileText className="h-3.5 w-3.5" />
                        </span>
                        <span className="font-medium">{r.doc_name}</span>
                        <span className="text-muted-foreground">· chunk {r.chunk_index + 1}</span>
                        <span className="ml-auto rounded bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[10px] text-emerald-600">
                          {(r.score * 100).toFixed(0)}% match
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed text-foreground/80">{r.content}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-16">
                <EmptyState
                  icon={Database}
                  title="Run a search to get started"
                  description="Query your knowledge base to see what your agents would retrieve."
                />
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Indexed Documents</CardTitle>
            </CardHeader>
            <CardContent>
              {!docs || docs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No documents indexed yet.</p>
              ) : (
                <div className="space-y-2">
                  {docs.map((d) => (
                    <div key={d.id} className="flex items-center gap-3 rounded-lg border p-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <FileText className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{d.name}</p>
                        <p className="text-xs text-muted-foreground">{d.chunk_count} chunks · {formatBytes(d.size)}</p>
                      </div>
                      <Badge variant={d.status === "ready" ? "success" : "secondary"}>{d.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Search Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {[
                { icon: Sparkles, label: "Semantic search", desc: "Embedding similarity" },
                { icon: Search, label: "Hybrid search", desc: "Semantic + keyword" },
                { icon: Filter, label: "Metadata filtering", desc: "Filter by source, type, date" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3 rounded-lg border p-2.5">
                  <item.icon className="h-4 w-4 text-violet-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}