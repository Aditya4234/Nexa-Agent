"use client";

import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  FileText,
  Loader2,
  Search,
  Trash2,
  Upload,
  Library,
  Share2,
  GitFork,
  Database,
  ScanSearch,
  Bot,
  ArrowDown,
  Box,
} from "lucide-react";
import { api, uploadFile } from "@/lib/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatBytes, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { KnowledgeDoc, KnowledgeSearchResult } from "@/types";

const ALLOWED = ".txt,.md,.markdown,.pdf,.json,.csv";

const RAG_STAGES = [
  { label: "Document", icon: FileText },
  { label: "Parser", icon: FileText },
  { label: "Cleaner", icon: Search },
  { label: "Chunker", icon: Box },
  { label: "Embedding", icon: ScanSearch },
  { label: "Vector DB", icon: Database },
  { label: "Retriever", icon: Search },
  { label: "Reranker", icon: GitFork },
  { label: "Agent", icon: Bot },
];

const GRAPH_NODES = [
  { id: "company", label: "Acme Corp", type: "company", x: "50%", y: "8%" },
  { id: "founder", label: "Jane Doe", type: "person", x: "18%", y: "32%" },
  { id: "product", label: "NexaAgent", type: "product", x: "50%", y: "32%" },
  { id: "competitor", label: "Rival Inc", type: "company", x: "82%", y: "32%" },
  { id: "doc1", label: "pricing_2026.pdf", type: "doc", x: "30%", y: "58%" },
  { id: "doc2", label: "company_wiki.md", type: "doc", x: "70%", y: "58%" },
];

const GRAPH_LINKS = [
  ["company", "founder", "founded by"],
  ["company", "product", "develops"],
  ["company", "competitor", "competes with"],
  ["product", "doc1", "referenced in"],
  ["product", "doc2", "referenced in"],
];

export default function KnowledgePage() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchMode, setSearchMode] = useState<string | null>(null);
  const [results, setResults] = useState<KnowledgeSearchResult[] | null>(null);
  const [searchError, setSearchError] = useState("");

  const { data: docs, isLoading } = useQuery<KnowledgeDoc[]>({ queryKey: ["knowledge"], queryFn: () => api.get("/api/knowledge") });

  const pickFile = () => fileRef.current?.click();

  const onFile = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try {
      await uploadFile<KnowledgeDoc>("/api/knowledge/upload", file);
      qc.invalidateQueries({ queryKey: ["knowledge"] });
    } catch (err: any) {
      setUploadError(err?.detail?.message || err?.message || "Upload failed.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this document from the knowledge base?")) return;
    await api.del(`/api/knowledge/${id}`);
    qc.invalidateQueries({ queryKey: ["knowledge"] });
  };

  const search = async () => {
    if (!query.trim() || searching) return;
    setSearching(true);
    setSearchError("");
    try {
      const res = await api.post<{ results: KnowledgeSearchResult[]; mode: string }>("/api/knowledge/search", { query: query.trim(), k: 4 });
      setResults(res.results);
      setSearchMode(res.mode);
    } catch (err: any) {
      setSearchError(err?.detail?.message || err?.message || "Search failed.");
      setResults(null);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <PageHeader
        eyebrow="Knowledge & RAG"
        title="Knowledge Base"
        description="Upload documents, embed them, and let agents retrieve grounded context with citations."
        actions={
          <>
            <input ref={fileRef} type="file" accept={ALLOWED} hidden onChange={(e) => onFile(e.target.files)} />
            <Button onClick={pickFile} disabled={uploading} className="bg-gradient-to-r from-violet-600 to-indigo-600 shadow-md shadow-violet-600/20">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? "Uploading…" : "Upload document"}
            </Button>
          </>
        }
      />

      {uploadError && <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{uploadError}</div>}

      <Tabs defaultValue="base">
        <TabsList>
          <TabsTrigger value="base">Base</TabsTrigger>
          <TabsTrigger value="search">Vector Search</TabsTrigger>
          <TabsTrigger value="pipeline">RAG Pipeline</TabsTrigger>
          <TabsTrigger value="graph">Knowledge Graph</TabsTrigger>
        </TabsList>

        <TabsContent value="base" className="space-y-6">
          <div>
            <h2 className="mb-3 text-lg font-semibold">Documents</h2>
            {isLoading ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-28 w-full" />
                ))}
              </div>
            ) : (docs?.length ?? 0) === 0 ? (
              <div className="rounded-xl border border-dashed py-16 text-center text-sm text-muted-foreground">
                No documents yet. Upload your first PDF, Markdown or text file.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {docs?.map((d) => (
                  <Card key={d.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => remove(d.id)} aria-label="Delete">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <CardTitle className="break-all pt-2 text-sm">{d.name}</CardTitle>
                      <CardDescription className="line-clamp-1">
                        {formatBytes(d.size)} · {d.chunk_count} chunks · {formatDate(d.created_at)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Badge variant={d.status === "ready" ? "success" : d.status === "failed" ? "destructive" : "secondary"}>{d.status}</Badge>
                      {d.status === "failed" && <p className="mt-2 text-xs text-destructive">{d.error}</p>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="search" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Retrieval test</CardTitle>
              <CardDescription>Ask a question to see what agents would retrieve from your knowledge base.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && search()}
                  placeholder="e.g. How does RAG work?"
                  className="flex-1"
                />
                <Button onClick={search} disabled={searching || !query.trim()}>
                  {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  Search
                </Button>
              </div>
              {searchError && <p className="mt-2 text-sm text-destructive">{searchError}</p>}
              {results && (
                <div className="mt-4 space-y-3">
                  <p className="text-xs text-muted-foreground">
                    {results.length} result{results.length === 1 ? "" : "s"} · mode: {searchMode === "embedding" ? "semantic embeddings" : "keyword"}
                  </p>
                  {results.map((r, i) => (
                    <div key={i} className="rounded-lg border bg-muted/30 p-3">
                      <div className="mb-1 flex items-center gap-2 text-xs">
                        <FileText className="h-3 w-3 text-primary" />
                        <span className="font-medium">{r.doc_name}</span>
                        <span className="text-muted-foreground">· chunk {r.chunk_index + 1}</span>
                        <span className="ml-auto rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] text-primary">score {r.score}</span>
                      </div>
                      <p className="text-sm leading-relaxed text-muted-foreground">{r.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pipeline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">RAG Pipeline</CardTitle>
              <CardDescription>How your documents become grounded, retrievable context for agents.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-1 py-4">
                {RAG_STAGES.map((stage, i) => (
                  <div key={stage.label} className="flex flex-col items-center">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.08, duration: 0.3 }}
                      className={cn(
                        "flex w-56 items-center gap-3 rounded-xl border px-4 py-2.5",
                        i >= 5 ? "border-violet-200 bg-violet-50/60" : "border-border bg-white"
                      )}
                    >
                      <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", i >= 5 ? "bg-violet-100 text-violet-600" : "bg-muted text-muted-foreground")}>
                        <stage.icon className="h-4 w-4" />
                      </span>
                      <span className="text-sm font-medium">{stage.label}</span>
                    </motion.div>
                    {i < RAG_STAGES.length - 1 && <ArrowDown className="my-1 h-4 w-4 text-violet-400" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="graph" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Knowledge Graph</CardTitle>
                  <CardDescription>Relationships between entities, documents and agents in your knowledge base.</CardDescription>
                </div>
                <Badge variant="outline" className="gap-1">
                  <Share2 className="h-3 w-3" /> {GRAPH_NODES.length} nodes
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative h-72 w-full overflow-hidden rounded-xl border bg-gradient-to-br from-violet-50/40 via-white to-indigo-50/40 sm:h-80">
                {GRAPH_LINKS.map(([a, b, rel], i) => (
                  <svg key={i} className="absolute inset-0 h-full w-full">
                    <line
                      x1={a === "company" ? "50%" : a === "founder" ? "18%" : a === "product" ? "50%" : a === "competitor" ? "82%" : a === "doc1" ? "30%" : "70%"}
                      y1={a === "company" ? "8%" : a === "founder" ? "32%" : a === "product" ? "32%" : a === "competitor" ? "32%" : a === "doc1" ? "58%" : "58%"}
                      x2={b === "company" ? "50%" : b === "founder" ? "18%" : b === "product" ? "50%" : b === "competitor" ? "82%" : b === "doc1" ? "30%" : "70%"}
                      y2={b === "company" ? "8%" : b === "founder" ? "32%" : b === "product" ? "32%" : b === "competitor" ? "32%" : b === "doc1" ? "58%" : "58%"}
                      stroke="#a78bfa"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                      className="transition-opacity"
                    />
                    <text x="50%" y="50%" fill="#8b5cf6" fontSize="10" textAnchor="middle" className="font-medium">
                      {rel}
                    </text>
                  </svg>
                ))}
                {GRAPH_NODES.map((n) => (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className={cn(
                      "absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-medium shadow-sm transition-all hover:scale-105 hover:shadow-md",
                      n.type === "company" && "border-violet-300 bg-white text-violet-700",
                      n.type === "person" && "border-emerald-200 bg-white text-emerald-700",
                      n.type === "product" && "border-indigo-200 bg-white text-indigo-700",
                      n.type === "doc" && "border-amber-200 bg-white text-amber-700"
                    )}
                    style={{ left: n.x, top: n.y }}
                  >
                    {n.label}
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}