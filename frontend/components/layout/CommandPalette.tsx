"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, CornerDownLeft, ArrowRight } from "lucide-react";
import { navSections } from "@/config/navigation";
import { useUI } from "@/stores/ui";
import { useAuth } from "@/stores/auth";
import { cn } from "@/lib/utils";

export function CommandPalette() {
  const router = useRouter();
  const { commandPaletteOpen, setCommandPaletteOpen } = useUI();
  const { logout } = useAuth();
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands = useMemo(() => {
    const items = navSections.flatMap((s) => s.items.map((i) => ({ kind: "nav" as const, title: i.title, href: i.href })));
    return [
      ...items,
      { kind: "action" as const, title: "New Chat", href: "/chat" },
      { kind: "action" as const, title: "Toggle theme", href: "" },
      { kind: "action" as const, title: "Sign out", href: "" },
    ];
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => c.title.toLowerCase().includes(q));
  }, [commands, query]);

  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery("");
      setIndex(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [commandPaletteOpen]);

  useEffect(() => {
    if (!commandPaletteOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCommandPaletteOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  useEffect(() => {
    const onToggle = () => setCommandPaletteOpen(!commandPaletteOpen);
    window.addEventListener("toggle-command-palette", onToggle);
    return () => window.removeEventListener("toggle-command-palette", onToggle);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  if (!commandPaletteOpen) return null;

  const run = (cmd: (typeof filtered)[number]) => {
    setCommandPaletteOpen(false);
    if (cmd.title === "Toggle theme") {
      const root = document.documentElement;
      root.classList.toggle("dark");
      return;
    }
    if (cmd.title === "Sign out") {
      logout();
      router.push("/login");
      return;
    }
    router.push(cmd.href);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh]">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setCommandPaletteOpen(false)} />
      <div className="relative w-full max-w-xl rounded-xl border bg-background shadow-2xl overflow-hidden">
        <div className="flex items-center gap-2 border-b px-4">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIndex(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") setIndex((i) => Math.min(i + 1, filtered.length - 1));
              if (e.key === "ArrowUp") setIndex((i) => Math.max(i - 1, 0));
              if (e.key === "Enter" && filtered[index]) run(filtered[index]);
            }}
            placeholder="Type a command or search…"
            className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">esc</kbd>
        </div>
        <div className="max-h-80 overflow-auto p-2">
          {filtered.length === 0 && <div className="px-3 py-6 text-center text-sm text-muted-foreground">No results for “{query}”</div>}
          {filtered.map((cmd, i) => (
            <button
              key={cmd.title + cmd.href}
              onMouseEnter={() => setIndex(i)}
              onClick={() => run(cmd)}
              className={cn(
                "flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm",
                i === index ? "bg-accent text-accent-foreground" : "text-foreground"
              )}
            >
              <span>{cmd.title}</span>
              {cmd.kind === "nav" ? <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" /> : <CornerDownLeft className="h-3.5 w-3.5 text-muted-foreground" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}