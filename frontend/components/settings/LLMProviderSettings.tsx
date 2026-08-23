"use client";

import { useCallback, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, KeyRound, Loader2, RefreshCw, XCircle } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { LLMConfig, LLMTestResult } from "@/types";

const PROVIDERS = [
  { id: "openai", label: "OpenAI" },
  { id: "openai_compatible", label: "OpenAI-compatible (Ollama, Groq, OpenRouter…)" },
  { id: "anthropic", label: "Anthropic (Claude)" },
];

export function LLMProviderSettings() {
  const qc = useQueryClient();
  const { data: cfg } = useQuery<LLMConfig>({ queryKey: ["llm-config"], queryFn: () => api.get("/api/settings/llm") });

  const [provider, setProvider] = useState("openai");
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [model, setModel] = useState("");
  const [embeddingModel, setEmbeddingModel] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testResult, setTestResult] = useState<LLMTestResult | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!cfg) return;
    setProvider(cfg.provider);
    setApiKey(cfg.api_key_masked);
    setBaseUrl(cfg.base_url);
    setModel(cfg.model);
    setEmbeddingModel(cfg.embedding_model);
  }, [cfg]);

  const flashSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const save = async (keyValue?: string) => {
    setSaving(true);
    setError("");
    setTestResult(null);
    try {
      await api.put("/api/settings/llm", {
        provider,
        api_key: keyValue !== undefined ? keyValue : apiKey,
        base_url: baseUrl,
        model,
        embedding_model: embeddingModel,
      });
      qc.invalidateQueries({ queryKey: ["llm-config"] });
      flashSaved();
    } catch (err: any) {
      setError(err?.detail?.message || err?.message || "Failed to save LLM config.");
    } finally {
      setSaving(false);
    }
  };

  const test = useCallback(async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await api.post<LLMTestResult>("/api/settings/llm/test", {
        provider,
        api_key: apiKey,
        base_url: baseUrl,
        model,
      });
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ ok: false, message: err?.detail?.message || err?.message || "Test failed.", latency_ms: null });
    } finally {
      setTesting(false);
    }
  }, [provider, apiKey, baseUrl, model]);

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-base">LLM Provider</CardTitle>
          <CardDescription>Connect a model provider to power agents with real streaming, tool calling, and embeddings.</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {cfg?.configured ? (
            <Badge className="gap-1 border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3 w-3" /> {cfg.source === "user" ? "Configured (you)" : "Global"}
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1 text-amber-600 dark:text-amber-400">
              <KeyRound className="h-3 w-3" /> Mock mode
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {saved && (
          <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600 dark:text-emerald-400">
            LLM configuration saved.
          </div>
        )}
        {error && <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
        {testResult && (
          <div
            className={`flex items-start gap-2 rounded-md border px-3 py-2 text-sm ${
              testResult.ok ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "border-destructive/40 bg-destructive/10 text-destructive"
            }`}
          >
            {testResult.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0" />}
            <span>
              {testResult.message}
              {testResult.latency_ms != null && <span className="opacity-70"> ({testResult.latency_ms} ms)</span>}
            </span>
          </div>
        )}

        <div className="space-y-2">
          <Label>Provider</Label>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-ring"
          >
            {PROVIDERS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>API key</Label>
            <div className="flex gap-2">
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-…"
                className="font-mono"
                autoComplete="off"
              />
              <Button type="button" variant="outline" onClick={() => save("CLEAR")} disabled={saving || !cfg?.configured} title="Remove stored key">
                Remove
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {cfg?.configured ? `Stored key: ${cfg.api_key_masked}. Leave as-is to keep it, or type a new one.` : "No key stored. Add one to leave mock mode."}
            </p>
          </div>
          {provider === "openai_compatible" && (
            <div className="space-y-2 sm:col-span-2">
              <Label>Base URL</Label>
              <Input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="https://api.openai.com/v1 or https://localhost:11434/v1" className="font-mono" />
            </div>
          )}
          <div className="space-y-2">
            <Label>Model</Label>
            <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder={provider === "anthropic" ? "claude-sonnet-4-5" : "gpt-4o-mini"} className="font-mono" />
          </div>
          <div className="space-y-2">
            <Label>Embedding model</Label>
            <Input value={embeddingModel} onChange={(e) => setEmbeddingModel(e.target.value)} placeholder="text-embedding-3-small" className="font-mono" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button onClick={() => save()} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save configuration
          </Button>
          <Button type="button" variant="outline" onClick={test} disabled={testing || saving}>
            {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Test connection
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}