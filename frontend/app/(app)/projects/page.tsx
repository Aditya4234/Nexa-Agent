"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FolderKanban, Loader2, Pencil, Plus, Trash2 } from "lucide-react";

import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/format";
import type { Project } from "@/types";

const ICONS = ["📁", "🚀", "🎯", "🧠", "🛠️", "📊", "💡", "🌍"];

export default function ProjectsPage() {
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: () => api.get("/api/projects"),
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState(ICONS[0]);

  function openCreate() {
    setEditing(null);
    setName("");
    setDescription("");
    setIcon(ICONS[0]);
    setDialogOpen(true);
  }

  function openEdit(p: Project) {
    setEditing(p);
    setName(p.name);
    setDescription(p.description);
    setIcon(p.icon);
    setDialogOpen(true);
  }

  const save = useMutation({
    mutationFn: async () => {
      if (editing) return api.put<Project>(`/api/projects/${editing.id}`, { name, description, icon });
      return api.post<Project>("/api/projects", { name, description, icon });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      setDialogOpen(false);
    },
  });

  const remove = useMutation({
    mutationFn: (id: number) => api.del(`/api/projects/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">Organize your agents and conversations into workspaces.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" /> New project
        </Button>
      </div>

      {isError && (
        <div className="flex items-center justify-between rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          Failed to load projects.
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-44 w-full" />
          ))}
        </div>
      ) : (data ?? []).length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <FolderKanban className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium">No projects yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Create a project to group related agents and conversations.</p>
          <Button className="mt-4" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" /> Create your first project
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(data ?? []).map((p) => (
            <Card key={p.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <span className="text-2xl">{p.icon}</span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)} aria-label="Edit project">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => remove.mutate(p.id)} aria-label="Delete project">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <CardTitle className="text-base">{p.name}</CardTitle>
                <CardDescription className="line-clamp-2">{p.description || "No description"}</CardDescription>
              </CardHeader>
              <CardFooter className="mt-auto gap-2">
                <Badge variant="secondary">{p.agent_count ?? 0} agents</Badge>
                <Badge variant="secondary">{p.conversation_count ?? 0} conversations</Badge>
                <span className="ml-auto text-xs text-muted-foreground">{formatDate(p.created_at)}</span>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit project" : "New project"}</DialogTitle>
            <DialogDescription>Projects group related agents and conversations into a workspace.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">Name</Label>
              <Input id="project-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Marketing Team" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-desc">Description</Label>
              <Textarea id="project-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="flex flex-wrap gap-2">
                {ICONS.map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setIcon(i)}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg border text-lg transition-colors ${
                      icon === i ? "border-primary bg-primary/5" : "border-border hover:bg-accent"
                    }`}
                  >
                    {i}
                  </button>
                ))}
              </div>
            </div>
            {save.isError && <p className="text-sm text-destructive">{(save.error as any)?.detail?.message || "Failed to save."}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending || !name.trim()}>
              {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {editing ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}