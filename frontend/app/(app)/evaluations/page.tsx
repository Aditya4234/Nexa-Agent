"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, FlaskConical, Loader2, Play, Plus, Trash2, XCircle } from "lucide-react";

import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/shared/PageHeader";
import { formatTime } from "@/lib/format";
import type { Agent, EvalRun, Evaluation } from "@/types";

type CaseResult = { input: string; expected: string; actual: string; passed: boolean; overlap: number };

export default function EvaluationsPage() {
  const qc = useQueryClient();
  const { data: evals = [], isLoading } = useQuery<Evaluation[]>({
    queryKey: ["evaluations"],
    queryFn: () => api.get("/api/evaluations"),
  });
  const { data: agents = [] } = useQuery<Agent[]>({ queryKey: ["agents"], queryFn: () => api.get("/api/agents") });

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [agentId, setAgentId] = useState("");
  const [model, setModel] = useState("default");
  const [casesText, setCasesText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [runs, setRuns] = useState<Record<number, EvalRun[]>>({});
  const [runBusy, setRunBusy] = useState<number | null>(null);

  async function create() {
    setSaving(true);
    setError(null);
    try {
      const cases = casesText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [input, ...rest] = line.split("|");
          return { input: input.trim(), expected: rest.join("|").trim() };
        });
      if (!name.trim() || cases.length === 0) throw new Error("A name and at least one case (format: input | expected) are required.");
      await api.post("/api/evaluations", {
        name: name.trim(),
        description,
        agent_id: agentId ? Number(agentId) : null,
        model,
        cases,
      });
      setOpen(false);
      setName("");
      setDescription("");
      setCasesText("");
      setAgentId("");
      setModel("default");
      qc.invalidateQueries({ queryKey: ["evaluations"] });
    } catch (err: any) {
      setError(err?.detail?.message || err?.message || "Failed to create evaluation.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteEval(id: number) {
    await api.del(`/api/evaluations/${id}`);
    qc.invalidateQueries({ queryKey: ["evaluations"] });
  }

  async function loadRuns(id: number) {
    const list = await api.get<EvalRun[]>(`/api/evaluations/${id}/runs`);
    setRuns((r) => ({ ...r, [id]: list }));
  }

  async function runEval(evalId: number) {
    setRunBusy(evalId);
    try {
      await api.post<EvalRun>(`/api/evaluations/${evalId}/run`);
      await loadRuns(evalId);
    } finally {
      setRunBusy(null);
    }
  }

  function parseResults(res: EvalRun): CaseResult[] {
    if (Array.isArray(res.results)) return res.results as CaseResult[];
    try {
      return JSON.parse(res.results) as CaseResult[];
    } catch {
      return [];
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <PageHeader
        eyebrow="Quality & Eval"
        title="Evaluations"
        description="Run test cases against your agents and track pass rates over time."
        actions={
          <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 shadow-md shadow-violet-600/20" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> New evaluation
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-44 w-full" />
          ))}
        </div>
      ) : evals.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <FlaskConical className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium">No evaluations yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Create an evaluation with test cases and run it against your agent.</p>
          <Button className="mt-4" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Create evaluation
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {evals.map((e) => {
            const evalRuns = runs[e.id] || [];
            const latest = evalRuns[0];
            const passRate = latest ? Math.round((latest.passed / Math.max(latest.total, 1)) * 100) : null;
            return (
              <Card key={e.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <FlaskConical className="h-5 w-5 text-primary" />
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteEval(e.id)} aria-label="Delete evaluation">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <CardTitle className="text-base">{e.name}</CardTitle>
                  <CardDescription className="line-clamp-2">{e.description || "No description"}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{e.model}</Badge>
                    {latest && passRate !== null && (
                      <Badge className={passRate >= 50 ? "bg-emerald-500/10 text-emerald-600" : "bg-destructive/10 text-destructive"}>
                        {passRate}% pass
                      </Badge>
                    )}
                  </div>
                  {latest && passRate !== null && (
                    <Progress value={passRate} className="h-1.5" />
                  )}
                  {evalRuns.length > 0 && (
                    <div className="max-h-28 space-y-1 overflow-auto rounded-md bg-muted/50 p-2">
                      {parseResults(latest).map((c, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs">
                          {c.passed ? <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" /> : <XCircle className="mt-0.5 h-3 w-3 shrink-0 text-destructive" />}
                          <span className="min-w-0 flex-1 truncate">{c.input}</span>
                          <span className="text-muted-foreground">{(c.overlap * 100).toFixed(0)}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="mt-auto justify-between">
                  <span className="text-xs text-muted-foreground">
                    {latest ? `Last run ${formatTime(latest.created_at)}` : "Not run yet"}
                  </span>
                  <div className="flex gap-2">
                    {evalRuns.length === 0 && (
                      <Button size="sm" variant="outline" onClick={() => loadRuns(e.id)}>
                        Runs
                      </Button>
                    )}
                    <Button size="sm" onClick={() => runEval(e.id)} disabled={runBusy === e.id}>
                      {runBusy === e.id ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Play className="h-3.5 w-3.5 mr-1" />}
                      Run
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New evaluation</DialogTitle>
            <DialogDescription>Define test cases as one per line in the format: input | expected.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="eval-name">Name</Label>
              <Input id="eval-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. FAQ accuracy" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="eval-desc">Description</Label>
              <Input id="eval-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="eval-agent">Agent (optional)</Label>
                <select
                  id="eval-agent"
                  value={agentId}
                  onChange={(e) => setAgentId(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">Default assistant</option>
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.icon} {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="eval-model">Model</Label>
                <select
                  id="eval-model"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="default">Auto (Default)</option>
                  <option value="gpt-4o-mini">GPT-4o mini</option>
                  <option value="gpt-4o">GPT-4o</option>
                  <option value="claude-sonnet-4-5">Claude Sonnet 4.5</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="eval-cases">Test cases</Label>
              <Textarea
                id="eval-cases"
                value={casesText}
                onChange={(e) => setCasesText(e.target.value)}
                rows={6}
                placeholder={"What is 2+2? | 4\nCapital of France | Paris\nWrite a haiku about code | sea\nhaiku\nbamboo"}
              />
              <p className="text-xs text-muted-foreground">One case per line. The input and expected answer are separated by a |.</p>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={create} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}