"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, KeyRound, Loader2, Plus, Trash2 } from "lucide-react";

import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import type { ApiKey, ApiKeyCreated } from "@/types";

export function ApiKeysSettings() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<ApiKey[]>({
    queryKey: ["api-keys"],
    queryFn: () => api.get("/api/api-keys"),
  });
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [revealed, setRevealed] = useState<ApiKeyCreated | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setCreating(true);
    setError(null);
    try {
      const key = await api.post<ApiKeyCreated>("/api/api-keys", { name: name.trim() || "Default key" });
      setRevealed(key);
      setName("");
      qc.invalidateQueries({ queryKey: ["api-keys"] });
    } catch (err: any) {
      setError(err?.detail?.message || err?.message || "Failed to create key");
    } finally {
      setCreating(false);
    }
  }

  async function revoke(id: number) {
    await api.del(`/api/api-keys/${id}`);
    qc.invalidateQueries({ queryKey: ["api-keys"] });
  }

  async function copyKey() {
    if (!revealed) return;
    await navigator.clipboard.writeText(revealed.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <KeyRound className="h-4 w-4" />
          API Keys
        </CardTitle>
        <CardDescription>Create keys to authenticate API calls with the X-API-Key header. Keys inherit your account's permissions.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {revealed && (
          <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/5 p-4 space-y-2">
            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Key created — copy it now, it will not be shown again.</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate rounded-md border bg-muted px-2 py-1.5 text-xs">{revealed.key}</code>
              <Button size="sm" variant="outline" onClick={copyKey}>
                <Copy className="h-3.5 w-3.5 mr-1" /> {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setRevealed(null)}>
              Done
            </Button>
          </div>
        )}

        <div className="flex items-end gap-2">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="key-name">Name</Label>
            <Input id="key-name" placeholder="e.g. CI pipeline" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <Button onClick={create} disabled={creating}>
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Create key
          </Button>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <div className="space-y-2">
            {(data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No API keys yet.</p>
            ) : (
              (data ?? []).map((k) => (
                <div key={k.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{k.name}</span>
                      {k.revoked && <Badge variant="secondary">revoked</Badge>}
                    </div>
                    <code className="text-xs text-muted-foreground">{k.prefix}</code>
                  </div>
                  <Button variant="ghost" size="icon" disabled={k.revoked} onClick={() => revoke(k.id)} aria-label="Revoke key">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))
            )}
          </div>
        )}

        <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
          <p className="font-medium mb-1">Usage</p>
          <code className="block">curl -H "X-API-Key: &lt;key&gt;" http://localhost:8000/api/chat \</code>
          <code className="block">{'-H "Content-Type: application/json" -d \'{"message":"hello"}\''}</code>
        </div>
      </CardContent>
    </Card>
  );
}