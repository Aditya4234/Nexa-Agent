"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen, Search, X, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { navSections } from "@/config/navigation";
import { useUI } from "@/stores/ui";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserMenu } from "./UserMenu";

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar, mobileSidebarOpen, setMobileSidebarOpen } = useUI();
  const [query, setQuery] = useState("");

  const flatItems = navSections.flatMap((s) => s.items);
  const filtered = query
    ? navSections
        .map((s) => ({ ...s, items: s.items.filter((i) => i.title.toLowerCase().includes(query.toLowerCase())) }))
        .filter((s) => s.items.length > 0)
    : navSections;

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href.split("?")[0]);
  };

  const logo = (
    <Link href="/dashboard" className={cn("flex items-center gap-2.5", sidebarCollapsed && "justify-center")}>
      <Image
        src="/logo.png"
        alt="NexaAgent logo"
        width={32}
        height={32}
        priority
        className="h-8 w-8 shrink-0 rounded-lg object-cover shadow-md shadow-violet-600/25"
      />
      {!sidebarCollapsed && (
        <span className="text-sm font-semibold tracking-tight">
          Nexa<span className="text-violet-600">Agent</span>
        </span>
      )}
    </Link>
  );

  const body = (
    <>
      <div className="flex h-14 shrink-0 items-center justify-between border-b px-4">
        {logo}
        <Button variant="ghost" size="icon" className="h-7 w-7 md:flex hidden" onClick={toggleSidebar} aria-label="Toggle sidebar">
          {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 md:hidden" onClick={() => setMobileSidebarOpen(false)} aria-label="Close sidebar">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {!sidebarCollapsed && (
        <div className="shrink-0 px-3 pb-1 pt-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search navigation…"
              className="h-8 pl-8 text-xs"
            />
          </div>
        </div>
      )}

      <ScrollArea className="min-h-0 flex-1 px-2 py-2">
        <nav className="space-y-4">
          {filtered.map((section) => (
            <div key={section.label}>
              {!sidebarCollapsed && (
                <div className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {section.label}
                </div>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = isActive(item.href);
                  const el = (
                    <Link
                      key={item.title}
                      href={item.href}
                      onClick={() => setMobileSidebarOpen(false)}
                      className={cn(
                        "group relative flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                        sidebarCollapsed && "justify-center px-0",
                        active
                          ? "bg-violet-50 text-violet-700 ring-1 ring-violet-200/70"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      )}
                    >
                      <item.icon className={cn("h-4 w-4 shrink-0", active && "text-violet-600")} />
                      {!sidebarCollapsed && <span className="truncate">{item.title}</span>}
                      {!sidebarCollapsed && item.badge && (
                        <span className="ml-auto rounded-full bg-violet-600 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                  if (sidebarCollapsed) {
                    return (
                      <Tooltip key={item.title}>
                        <TooltipTrigger asChild>{el}</TooltipTrigger>
                        <TooltipContent side="right">{item.title}</TooltipContent>
                      </Tooltip>
                    );
                  }
                  return el;
                })}
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div className="px-3 py-6 text-center text-xs text-muted-foreground">No matches</div>}
        </nav>
      </ScrollArea>

      {/* System status */}
      {!sidebarCollapsed && (
        <div className="mx-3 mb-2 flex items-center gap-2 rounded-lg border border-emerald-200/70 bg-emerald-50/60 px-3 py-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-xs font-medium text-emerald-700">All systems operational</span>
          <ChevronRight className="ml-auto h-3.5 w-3.5 text-emerald-500/60" />
        </div>
      )}

      <div className="shrink-0 border-t p-2">
        <UserMenu collapsed={sidebarCollapsed} />
      </div>
    </>
  );

  return (
    <TooltipProvider delayDuration={200}>
      {/* Desktop */}
      <aside
        className={cn(
          "hidden md:flex flex-col border-r bg-background transition-all duration-200",
          sidebarCollapsed ? "w-14" : "w-64"
        )}
      >
        {body}
      </aside>
      {/* Mobile drawer */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileSidebarOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex h-[100dvh] w-72 max-w-[85vw] flex-col border-r bg-background shadow-xl overflow-hidden">{body}</aside>
        </div>
      )}
    </TooltipProvider>
  );
}