"use client";

import { useEffect, useRef, useState } from "react";
import { Paperclip, Globe, Wrench, Plug, Mic, Square, ArrowUp } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Agent, Plugin, ToolInfo } from "@/types";

interface ChatInputProps {
  onSend: (message: string) => void;
  onStop: () => void;
  streaming: boolean;
  agents: Agent[];
  tools: ToolInfo[];
  plugins: Plugin[];
  selectedAgentId: number | null;
  setSelectedAgentId: (id: number | null) => void;
  selectedTools: string[];
  toggleTool: (id: string) => void;
  selectedPlugins: string[];
  togglePlugin: (id: string) => void;
  model: string;
  setModel: (m: string) => void;
  files: File[];
  setFiles: (f: File[]) => void;
}

export function ChatInput({
  onSend,
  onStop,
  streaming,
  agents,
  tools,
  plugins,
  selectedAgentId,
  setSelectedAgentId,
  selectedTools,
  toggleTool,
  selectedPlugins,
  togglePlugin,
  model,
  setModel,
  files,
  setFiles,
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
  }, [value]);

  const send = () => {
    const msg = value.trim();
    if (!msg || streaming) return;
    onSend(msg);
    setValue("");
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-4">
      {files.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {files.map((f, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 rounded-full border bg-muted px-2.5 py-1 text-xs">
              <Paperclip className="h-3 w-3" />
              {f.name}
              <button className="ml-0.5 text-muted-foreground hover:text-destructive" onClick={() => setFiles(files.filter((_, j) => j !== i))}>
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="rounded-2xl border bg-background shadow-lg focus-within:ring-2 focus-within:ring-ring">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Message agents, set a goal, or ask a question…"
          className="min-h-[44px] max-h-40 resize-none border-0 bg-transparent px-4 py-3 text-sm shadow-none focus-visible:ring-0"
          rows={1}
        />

        <div className="flex items-center justify-between gap-2 px-3 pb-2.5 pt-1">
          <div className="flex items-center gap-1">
            <input ref={fileRef} type="file" multiple hidden onChange={(e) => setFiles([...files, ...Array.from(e.target.files || [])])} />
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => fileRef.current?.click()} aria-label="Attach files" title="Attach files">
              <Paperclip className="h-4 w-4" />
            </Button>
            <ToolPopover selectedTools={selectedTools} tools={tools} toggleTool={toggleTool} />
            <PluginPopover selectedPlugins={selectedPlugins} plugins={plugins} togglePlugin={togglePlugin} />
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" aria-label="Voice input" title="Voice (coming soon)">
              <Mic className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedAgentId ?? ""}
              onChange={(e) => setSelectedAgentId(e.target.value ? Number(e.target.value) : null)}
              className="h-8 max-w-[140px] rounded-md border border-input bg-background px-2 text-xs outline-none focus:ring-1 focus:ring-ring"
              title="Agent"
            >
              <option value="">Assistant</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.icon} {a.name}
                </option>
              ))}
            </select>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="h-8 max-w-[130px] rounded-md border border-input bg-background px-2 text-xs outline-none focus:ring-1 focus:ring-ring"
              title="Model"
            >
              <option value="default">Auto</option>
              <option value="gpt-4o-mini">GPT-4o mini</option>
              <option value="gpt-4o">GPT-4o</option>
              <option value="claude-sonnet-4-5">Claude 4.5</option>
            </select>

            {streaming ? (
              <Button variant="secondary" size="sm" className="h-8 gap-1.5" onClick={onStop}>
                <Square className="h-3.5 w-3.5" /> Stop
              </Button>
            ) : (
              <Button size="sm" className="h-8 gap-1.5" onClick={send} disabled={!value.trim()}>
                <ArrowUp className="h-3.5 w-3.5" /> Send
              </Button>
            )}
          </div>
        </div>
      </div>
      <p className="mt-2 text-center text-[11px] text-muted-foreground">
        Agents may make mistakes. Verify important results and approve sensitive actions.
      </p>
    </div>
  );
}

function ToolPopover({ selectedTools, tools, toggleTool }: { selectedTools: string[]; tools: ToolInfo[]; toggleTool: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        size="icon"
        className={cn("h-8 w-8", selectedTools.length > 0 ? "text-primary" : "text-muted-foreground")}
        onClick={() => setOpen((o) => !o)}
        aria-label="Select tools"
        title="Tools"
      >
        <Wrench className="h-4 w-4" />
      </Button>
      {open && (
        <div className="absolute bottom-11 left-0 z-50 w-64 rounded-lg border bg-popover p-2 shadow-xl">
          <p className="px-2 pb-1.5 text-xs font-medium text-muted-foreground">Enable tools</p>
          {tools.length === 0 && <p className="px-2 pb-1 text-xs text-muted-foreground">No tools registered.</p>}
          <div className="max-h-64 space-y-0.5 overflow-y-auto">
            {tools.map((t) => {
              const on = selectedTools.includes(t.id);
              return (
                <button
                  key={t.id}
                  onClick={() => toggleTool(t.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm",
                    on ? "bg-primary/10 text-primary" : "hover:bg-accent"
                  )}
                >
                  <Globe className="h-3.5 w-3.5 shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{t.name}</span>
                    <span className="block truncate text-[11px] text-muted-foreground">{t.description}</span>
                  </span>
                  {on && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function PluginPopover({
  selectedPlugins,
  plugins,
  togglePlugin,
}: {
  selectedPlugins: string[];
  plugins: Plugin[];
  togglePlugin: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        size="icon"
        className={cn("h-8 w-8", selectedPlugins.length > 0 ? "text-primary" : "text-muted-foreground")}
        onClick={() => setOpen((o) => !o)}
        aria-label="Select plugins"
        title="Plugins / integrations"
      >
        <Plug className="h-4 w-4" />
      </Button>
      {open && (
        <div className="absolute bottom-11 left-0 z-50 w-72 rounded-lg border bg-popover p-2 shadow-xl">
          <div className="flex items-center justify-between px-2 pb-1.5">
            <p className="text-xs font-medium text-muted-foreground">Enable plugins</p>
            <span className="text-[10px] text-muted-foreground">
              {selectedPlugins.length}/{plugins.length} on
            </span>
          </div>
          {plugins.length === 0 && <p className="px-2 pb-1 text-xs text-muted-foreground">No plugins available.</p>}
          <div className="max-h-64 space-y-0.5 overflow-y-auto">
            {plugins.map((p) => {
              const on = selectedPlugins.includes(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => togglePlugin(p.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm",
                    on ? "bg-primary/10 text-primary" : "hover:bg-accent"
                  )}
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted text-sm">{p.icon}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{p.name}</span>
                    <span className="block truncate text-[11px] text-muted-foreground">{p.description}</span>
                  </span>
                  {on && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}