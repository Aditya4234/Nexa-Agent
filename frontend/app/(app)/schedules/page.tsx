"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CalendarClock, Clock, Pause, Play, Plus, Trash2, Globe } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusPill } from "@/components/shared/StatusPill";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const initial = [
  { id: 1, name: "AI News Research Agent", schedule: "Every day at 08:00", agent: "Research Agent", timezone: "Asia/Kolkata", status: "running", next: "Tomorrow, 08:00" },
  { id: 2, name: "Competitor Analysis", schedule: "Every Monday at 09:00", agent: "Research Agent", timezone: "Asia/Kolkata", status: "running", next: "Monday, 09:00" },
  { id: 3, name: "GitHub Issue Summary", schedule: "Every night at 23:30", agent: "Coding Agent", timezone: "UTC", status: "paused", next: "—" },
  { id: 4, name: "Business Analytics", schedule: "1st of every month", agent: "Data Analyst", timezone: "Asia/Kolkata", status: "running", next: "Sep 1, 09:00" },
];

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState(initial);

  const toggle = (id: number) =>
    setSchedules((prev) => prev.map((s) => (s.id === id ? { ...s, status: s.status === "running" ? "paused" : "running", next: s.status === "running" ? "—" : s.next === "—" ? "Next run queued" : s.next } : s)));

  const remove = (id: number) => setSchedules((prev) => prev.filter((s) => s.id !== id));

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <PageHeader
        eyebrow="Automation"
        title="Scheduled Agents"
        description="Run agents automatically on cron-like schedules with full timezone support."
        actions={
          <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 shadow-md shadow-violet-600/20">
            <Plus className="h-4 w-4" /> New schedule
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active schedules</CardTitle>
          <CardDescription>{schedules.filter((s) => s.status === "running").length} running · {schedules.filter((s) => s.status === "paused").length} paused</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {schedules.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.3 }}
                className={cn("flex flex-wrap items-center gap-3 rounded-xl border p-4 transition-colors", s.status === "paused" && "opacity-70")}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                  <CalendarClock className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{s.name}</p>
                  <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {s.schedule}</span>
                    <span className="inline-flex items-center gap-1"><Globe className="h-3 w-3" /> {s.timezone}</span>
                    <span>{s.agent}</span>
                    {s.status === "running" && <span className="font-medium text-emerald-600">· next: {s.next}</span>}
                  </p>
                </div>
                <StatusPill status={s.status} />
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => toggle(s.id)} aria-label={s.status === "running" ? "Pause" : "Resume"}>
                    {s.status === "running" ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(s.id)} className="text-muted-foreground hover:text-destructive" aria-label="Delete">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { title: "Cron-like expressions", desc: "Full cron syntax, presets and one-time runs." },
          { title: "Time zones", desc: "Schedule in any timezone with DST handling." },
          { title: "Pause & resume", desc: "Suspend schedules without losing config." },
        ].map((f) => (
          <Card key={f.title}>
            <CardContent className="p-5">
              <p className="text-sm font-semibold">{f.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{f.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}