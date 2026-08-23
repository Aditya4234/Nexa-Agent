"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Agent, AgentTemplate, Project, ToolInfo } from "@/types";

const ICONS = ["🤖", "🔎", "💻", "📊", "✍️", "🎯", "🧪", "🛠", "🧠", "📚"];

export function AgentForm({ agent, template }: { agent?: Agent; template?: AgentTemplate }) {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: tools = [] } = useQuery<ToolInfo[]>({ queryKey: ["tools"], queryFn: () => api.get("/api/runs/meta/tools") });
  const { data: projects = [] } = useQuery<Project[]>({ queryKey: ["projects"], queryFn: () => api.get("/api/projects") });

  const [form, setForm] = useState({
    name: agent?.name || template?.name || "",
    description: agent?.description || template?.description || "",
    system_prompt: agent?.system_prompt || template?.system_prompt || "",
    model: agent?.model || "default",
    temperature: agent?.temperature ?? 0.7,
    max_tokens: agent?.max_tokens ?? 2048,
    fallback_model: agent?.fallback_model || "",
    tools: agent?.tools || template?.tools || [],
    memory_enabled: agent?.memory_enabled ?? true,
    max_steps: agent?.max_steps ?? 10,
    timeout: agent?.timeout ?? 120,
    icon: agent?.icon || template?.icon || "🤖",
    project_id: agent?.project_id ?? null,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }));

  const toggleTool = (id: string) =>
    set("tools", form.tools.includes(id) ? form.tools.filter((t) => t !== id) : [...form.tools, id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (agent) {
        await api.put(`/api/agents/${agent.id}`, form);
      } else {
        await api.post("/api/agents", form);
      }
      qc.invalidateQueries({ queryKey: ["agents"] });
      router.push("/agents");
    } catch (err: any) {
      setError(err?.detail?.message || err?.message || "Failed to save agent.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="mx-auto max-w-3xl space-y-6">
      {error && <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Identity</CardTitle>
          <CardDescription>Name your agent and choose an icon</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border bg-muted text-2xl">{form.icon}</div>
            <div className="grid flex-1 grid-cols-4 gap-2 sm:grid-cols-8">
              {ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  aria-label={`Use ${icon} icon`}
                  aria-pressed={form.icon === icon}
                  onClick={() => set("icon", icon)}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg border text-lg transition-colors",
                    form.icon === icon ? "border-primary bg-primary/10" : "border-border hover:bg-accent"
                  )}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Research Agent" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="What does this agent do?" rows={2} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="project">Project</Label>
            <select
              id="project"
              value={form.project_id ?? ""}
              onChange={(e) => set("project_id", e.target.value ? Number(e.target.value) : null)}
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">No project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.icon} {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="prompt">System instructions</Label>
            <Textarea id="prompt" value={form.system_prompt} onChange={(e) => set("system_prompt", e.target.value)} placeholder="Define the agent's personality, expertise, and constraints…" rows={6} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Model & Behavior</CardTitle>
          <CardDescription>Configure the reasoning engine</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <select
                id="model"
                value={form.model}
                onChange={(e) => set("model", e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="default">Auto (Default)</option>
                <option value="gpt-4o-mini">GPT-4o mini</option>
                <option value="gpt-4o">GPT-4o</option>
                <option value="claude-sonnet-4-5">Claude Sonnet 4.5</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="temperature">Temperature · {form.temperature.toFixed(1)}</Label>
              <input
                id="temperature"
                type="range"
                min={0}
                max={2}
                step={0.1}
                value={form.temperature}
                onChange={(e) => set("temperature", Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_tokens">Max tokens · {form.max_tokens.toLocaleString()}</Label>
              <input
                id="max_tokens"
                type="range"
                min={256}
                max={8192}
                step={256}
                value={form.max_tokens}
                onChange={(e) => set("max_tokens", Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="steps">Max steps</Label>
              <Input id="steps" type="number" min={1} max={50} value={form.max_steps} onChange={(e) => set("max_steps", Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timeout">Timeout (seconds)</Label>
              <Input id="timeout" type="number" min={10} max={3600} value={form.timeout} onChange={(e) => set("timeout", Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fallback_model">Fallback model</Label>
              <Input id="fallback_model" value={form.fallback_model} onChange={(e) => set("fallback_model", e.target.value)} placeholder="e.g. gpt-4o-mini (used if the primary fails)" />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Conversation memory</p>
              <p className="text-xs text-muted-foreground">Remember context across messages in a conversation</p>
            </div>
            <Switch aria-label="Toggle conversation memory" checked={form.memory_enabled} onCheckedChange={(v) => set("memory_enabled", v)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tools</CardTitle>
          <CardDescription>Enable tools this agent may use. Each call is logged and permission-checked.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          {tools.length === 0 && <p className="text-sm text-muted-foreground">No tools registered on the server.</p>}
          {tools.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => toggleTool(t.id)}
              className={cn(
                "flex items-start gap-2 rounded-lg border p-3 text-left transition-colors",
                form.tools.includes(t.id) ? "border-primary bg-primary/5" : "border-border hover:bg-accent"
              )}
            >
              <span
                className={cn(
                  "mt-0.5 h-4 w-4 shrink-0 rounded-sm border flex items-center justify-center text-[10px]",
                  form.tools.includes(t.id) ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40"
                )}
              >
                {form.tools.includes(t.id) && "✓"}
              </span>
              <span>
                <span className="block text-sm font-medium">{t.name}</span>
                <span className="block text-xs text-muted-foreground">{t.description}</span>
              </span>
            </button>
          ))}
        </CardContent>
      </Card>

      <CardFooter className="justify-end gap-3 px-0">
        <Button type="button" variant="outline" onClick={() => router.push("/agents")}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {agent ? "Save changes" : "Create agent"}
        </Button>
      </CardFooter>
    </form>
  );
}