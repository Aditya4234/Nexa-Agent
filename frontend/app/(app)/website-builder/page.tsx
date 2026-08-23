"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Sparkles,
  Loader2,
  Globe2,
  Eye,
  Code2,
  ExternalLink,
  Download,
  Copy,
  CheckCircle2,
  CircleDashed,
  Trash2,
  History,
  Wand2,
  Monitor,
  Tablet,
  Smartphone,
  AlertTriangle,
} from "lucide-react";
import { api, API_URL, streamSSE } from "@/lib/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { GeneratedSite, SiteSummary } from "@/types";

const examples = [
  "Modern portfolio for a UI/UX designer with dark theme",
  "Restaurant website with menu, gallery and table booking",
  "SaaS landing page for an AI note-taking app with pricing",
  "Yoga studio site with class schedule and trainer profiles",
];

const stages = [
  { key: "planning", label: "Planning structure" },
  { key: "writing", label: "Writing HTML, CSS & JS" },
  { key: "saving", label: "Publishing live URL" },
];

const deviceWidths = { desktop: "100%", tablet: "768px", mobile: "390px" } as const;
type Device = keyof typeof deviceWidths;

export default function WebsiteBuilderPage() {
  const queryClient = useQueryClient();
  const { data: sites = [] } = useQuery<SiteSummary[]>({
    queryKey: ["sites"],
    queryFn: () => api.get("/api/sites"),
  });

  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState("");
  const [error, setError] = useState("");
  const [site, setSite] = useState<GeneratedSite | null>(null);
  const [code, setCode] = useState("");
  const [previewHtml, setPreviewHtml] = useState("");
  const [tab, setTab] = useState<"preview" | "code">("preview");
  const [device, setDevice] = useState<Device>("desktop");
  const [reviseText, setReviseText] = useState("");
  const [copied, setCopied] = useState(false);

  const codeRef = useRef("");
  const lastFlush = useRef(0);

  const flush = useCallback((force = false) => {
    const now = Date.now();
    if (force || now - lastFlush.current > 250) {
      lastFlush.current = now;
      setCode(codeRef.current);
      setPreviewHtml(codeRef.current);
    }
  }, []);

  useEffect(() => {
    if (!busy) return;
    const t = setInterval(() => flush(), 300);
    return () => clearInterval(t);
  }, [busy, flush]);

  const runStream = useCallback(
    async (path: string, body: Record<string, unknown>) => {
      let failed = false;
      await streamSSE(path, body, (event, data) => {
        if (event === "status") setStage(data.stage);
        else if (event === "delta") {
          codeRef.current += data.text;
          flush();
        } else if (event === "done") {
          const s = data.site as GeneratedSite;
          setSite(s);
          codeRef.current = s.html;
          setCode(s.html);
          setPreviewHtml(s.html);
          setTab("preview");
          queryClient.invalidateQueries({ queryKey: ["sites"] });
        } else if (event === "error") {
          setError(data.message);
          failed = true;
        }
      });
      return !failed;
    },
    [flush, queryClient]
  );

  const generate = async () => {
    if (!prompt.trim() || busy) return;
    setBusy(true);
    setError("");
    setStage("planning");
    setSite(null);
    codeRef.current = "";
    setCode("");
    setPreviewHtml("");
    try {
      await runStream("/api/sites/generate", { prompt });
    } catch {
      setError("Could not reach the server. Is the backend running?");
    } finally {
      setBusy(false);
    }
  };

  const revise = async () => {
    if (!site || !reviseText.trim() || busy) return;
    setBusy(true);
    setError("");
    setStage("planning");
    codeRef.current = "";
    try {
      await runStream(`/api/sites/${site.id}/revise`, { instruction: reviseText });
      setReviseText("");
    } catch {
      setError("Could not reach the server. Is the backend running?");
    } finally {
      setBusy(false);
    }
  };

  const openSite = async (id: number) => {
    if (busy) return;
    const s = await api.get<GeneratedSite>(`/api/sites/${id}`);
    setSite(s);
    codeRef.current = s.html;
    setCode(s.html);
    setPreviewHtml(s.html);
    setTab("preview");
    setError("");
  };

  const removeSite = async (id: number) => {
    await api.del(`/api/sites/${id}`);
    if (site?.id === id) setSite(null);
    queryClient.invalidateQueries({ queryKey: ["sites"] });
  };

  const download = () => {
    if (!site) return;
    const blob = new Blob([site.html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${site.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "website"}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyCode = async () => {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const stageIndex = stages.findIndex((s) => s.key === stage);
  const liveUrl = site ? `${API_URL}/preview/${site.share_id}` : "";

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <PageHeader
        eyebrow="AI Website Builder"
        title="Website Builder"
        description="Describe your website in one line — AI builds the complete site and you see it live instantly."
        actions={
          site && (
            <Button variant="outline" onClick={() => window.open(liveUrl, "_blank")}>
              <ExternalLink className="h-4 w-4" /> Open Live
            </Button>
          )
        }
      />

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        {/* Left: prompt + history */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-violet-500" /> Describe your website
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) generate();
                }}
                rows={4}
                placeholder="e.g. A modern bakery website with menu, gallery and online order form"
              />
              <div className="flex flex-wrap gap-1.5">
                {examples.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => setPrompt(ex)}
                    disabled={busy}
                    className="rounded-full border bg-muted/50 px-2.5 py-1 text-left text-xs text-muted-foreground transition hover:border-violet-400 hover:text-violet-600 disabled:opacity-50"
                  >
                    {ex.length > 42 ? ex.slice(0, 42) + "…" : ex}
                  </button>
                ))}
              </div>
              <Button
                onClick={generate}
                disabled={busy || !prompt.trim()}
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 shadow-lg shadow-violet-600/25"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                {busy ? "Building your website…" : "Generate Website"}
              </Button>
              {error && (
                <p className="flex items-start gap-1.5 rounded-md bg-destructive/10 p-2 text-xs text-destructive">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {error}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <History className="h-4 w-4" /> Your Sites
                <Badge variant="secondary" className="ml-auto">{sites.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {sites.length === 0 && <p className="text-sm text-muted-foreground">No sites yet. Generate your first one!</p>}
              {sites.map((s) => (
                <div
                  key={s.id}
                  className={cn(
                    "group flex items-center gap-2 rounded-lg border p-2.5 transition hover:border-violet-400/60",
                    site?.id === s.id && "border-violet-500 bg-violet-500/5"
                  )}
                >
                  <button onClick={() => openSite(s.id)} className="min-w-0 flex-1 text-left">
                    <p className="truncate text-sm font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</p>
                  </button>
                  <button
                    onClick={() => window.open(`${API_URL}/preview/${s.share_id}`, "_blank")}
                    title="Open live"
                    className="rounded p-1.5 text-muted-foreground opacity-0 transition hover:bg-muted hover:text-violet-600 group-hover:opacity-100"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => removeSite(s.id)}
                    title="Delete"
                    className="rounded p-1.5 text-muted-foreground opacity-0 transition hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right: preview / code */}
        <Card className="flex min-h-[640px] flex-col overflow-hidden">
          <CardHeader className="border-b py-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-lg border p-0.5">
                <button
                  onClick={() => setTab("preview")}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition",
                    tab === "preview" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Eye className="h-3.5 w-3.5" /> Preview
                </button>
                <button
                  onClick={() => setTab("code")}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition",
                    tab === "code" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Code2 className="h-3.5 w-3.5" /> Code
                </button>
              </div>

              {tab === "preview" && (
                <div className="flex rounded-lg border p-0.5">
                  {([
                    ["desktop", Monitor],
                    ["tablet", Tablet],
                    ["mobile", Smartphone],
                  ] as const).map(([d, Icon]) => (
                    <button
                      key={d}
                      onClick={() => setDevice(d)}
                      title={d}
                      className={cn(
                        "rounded-md p-1.5 transition",
                        device === d ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </button>
                  ))}
                </div>
              )}

              <div className="ml-auto flex items-center gap-2">
                {busy && (
                  <Badge variant="warning" className="gap-1.5">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
                    Building…
                  </Badge>
                )}
                {!busy && site && (
                  <>
                    <Badge variant="success" className="gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Live
                    </Badge>
                    <Button size="sm" variant="outline" onClick={copyCode}>
                      {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                    <Button size="sm" variant="outline" onClick={download}>
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => window.open(liveUrl, "_blank")}>
                      <Globe2 className="h-3.5 w-3.5" /> Live URL
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex flex-1 flex-col p-0">
            {!site && !busy && (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 p-10 text-center">
                <div className="rounded-2xl bg-gradient-to-br from-violet-500/15 to-indigo-500/15 p-4">
                  <Globe2 className="h-8 w-8 text-violet-500" />
                </div>
                <p className="font-medium">Your generated website will appear here</p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Write a prompt on the left, hit Generate, and watch a complete responsive website being built — then open it live or download it.
                </p>
              </div>
            )}

            {busy && (
              <div className="space-y-3 border-b px-4 py-3">
                {stages.map((s, i) => {
                  const isActive = i === stageIndex;
                  const isDone = i < stageIndex;
                  return (
                    <motion.div key={s.key} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-sm">
                      {isDone ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : isActive ? (
                        <Loader2 className="h-4 w-4 animate-spin text-violet-500" />
                      ) : (
                        <CircleDashed className="h-4 w-4 text-muted-foreground/40" />
                      )}
                      <span className={cn(!isDone && !isActive && "text-muted-foreground/60")}>{s.label}</span>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {(site || busy) && tab === "preview" && (
              <div className="flex flex-1 justify-center overflow-auto bg-muted/40 p-4">
                <iframe
                  title="Website preview"
                  srcDoc={previewHtml}
                  sandbox="allow-scripts allow-forms allow-popups"
                  className="h-full min-h-[520px] w-full rounded-xl border bg-white shadow-xl transition-all duration-300"
                  style={{ maxWidth: deviceWidths[device] }}
                />
              </div>
            )}

            {(site || busy) && tab === "code" && (
              <pre className="flex-1 overflow-auto bg-zinc-950 p-4 font-mono text-xs leading-relaxed text-zinc-200">
                <code>{code}</code>
              </pre>
            )}

            {site && !busy && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  revise();
                }}
                className="flex gap-2 border-t p-3"
              >
                <Input value={reviseText} onChange={(e) => setReviseText(e.target.value)} placeholder="Want changes? e.g. make the hero dark blue and add testimonials section" />
                <Button type="submit" disabled={!reviseText.trim()} className="shrink-0">
                  <Wand2 className="h-4 w-4" /> Revise
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
