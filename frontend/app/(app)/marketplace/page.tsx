"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Star, Users, Play, Search, Store, ArrowRight, BadgeCheck } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const CATEGORIES = ["All", "Research", "Coding", "Marketing", "Sales", "Finance", "Data", "Productivity", "Developer Tools"];

const AGENTS = [
  { name: "Research Agent", icon: "🔎", desc: "Research competitors, markets and products with citations.", rating: 4.9, runs: "24.1K", users: "5.2K", cat: "Research", tools: ["web_search", "browser", "files"], verified: true },
  { name: "Coding Agent", icon: "💻", desc: "Write, test and debug code across any stack.", rating: 4.8, runs: "18.7K", users: "4.1K", cat: "Coding", tools: ["code_execution", "github", "python"], verified: true },
  { name: "Data Analyst", icon: "📊", desc: "Analyze datasets and generate actionable insights.", rating: 4.7, runs: "12.3K", users: "2.9K", cat: "Data", tools: ["python", "sql", "files"], verified: true },
  { name: "SEO Agent", icon: "🔍", desc: "Audits pages, finds keywords and suggests improvements.", rating: 4.6, runs: "9.1K", users: "1.8K", cat: "Marketing", tools: ["web_search", "browser", "crawler"], verified: false },
  { name: "Content Agent", icon: "✍️", desc: "Researches and creates high-quality, on-brand content.", rating: 4.8, runs: "15.5K", users: "3.4K", cat: "Marketing", tools: ["web_search", "files", "rag"], verified: true },
  { name: "Sales Agent", icon: "🎯", desc: "Researches leads and prepares personalized outreach.", rating: 4.7, runs: "11.9K", users: "2.6K", cat: "Sales", tools: ["web_search", "email", "crm"], verified: false },
  { name: "Knowledge Agent", icon: "📚", desc: "Answers questions from your private documents with citations.", rating: 4.9, runs: "20.4K", users: "4.7K", cat: "Productivity", tools: ["rag", "files", "web_search"], verified: true },
  { name: "DevOps Agent", icon: "🛠", desc: "Triages incidents, checks deployments and drafts runbooks.", rating: 4.5, runs: "7.8K", users: "1.1K", cat: "Developer Tools", tools: ["github", "code_execution", "slack"], verified: false },
  { name: "Financial Analyst", icon: "📈", desc: "Analyzes statements, flags risks and forecasts performance.", rating: 4.8, runs: "8.9K", users: "1.6K", cat: "Finance", tools: ["python", "sql", "files"], verified: true },
  { name: "Support Agent", icon: "🎧", desc: "Resolves customer questions from your docs and tickets.", rating: 4.6, runs: "17.2K", users: "3.9K", cat: "Productivity", tools: ["rag", "tickets", "email"], verified: true },
  { name: "Recruiter Agent", icon: "👥", desc: "Screens candidates and shortlists based on role criteria.", rating: 4.4, runs: "4.6K", users: "0.8K", cat: "Sales", tools: ["web_search", "email"], verified: false },
  { name: "Compliance Agent", icon: "⚖️", desc: "Reviews documents against policy and flags violations.", rating: 4.7, runs: "5.3K", users: "1.0K", cat: "Finance", tools: ["files", "rag", "email"], verified: true },
];

export default function MarketplacePage() {
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");

  const filtered = AGENTS.filter(
    (a) =>
      (category === "All" || a.cat === category) &&
      (query.trim() === "" || a.name.toLowerCase().includes(query.toLowerCase()) || a.desc.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <PageHeader
        eyebrow="Agent Ecosystem"
        title="Agent Marketplace"
        description="Ready-to-run agents from the community and the NexaAgent team."
      />

      <div className="flex flex-wrap items-center gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
              category === c ? "bg-violet-600 text-white shadow-md shadow-violet-600/20" : "bg-muted text-muted-foreground hover:bg-muted/70"
            )}
          >
            {c}
          </button>
        ))}
        <div className="relative ml-auto">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search marketplace…" className="h-9 w-56 pl-8 text-sm" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((a, i) => (
          <motion.div
            key={a.name}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.3 }}
          >
            <Card className="flex h-full flex-col transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet-900/10">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-50 to-indigo-50 text-2xl ring-1 ring-violet-100">
                    {a.icon}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {a.verified && (
                      <Badge variant="outline" className="gap-1 text-[10px]">
                        <BadgeCheck className="h-3 w-3 text-violet-600" /> Verified
                      </Badge>
                    )}
                    <Badge variant="outline">{a.cat}</Badge>
                  </div>
                </div>
                <CardTitle className="pt-2 text-base">{a.name}</CardTitle>
                <CardDescription className="line-clamp-2">{a.desc}</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1 font-medium text-amber-600">
                  <Star className="h-3.5 w-3.5 fill-current" /> {a.rating.toFixed(1)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Play className="h-3 w-3" /> {a.runs} runs
                </span>
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3 w-3" /> {a.users} users
                </span>
              </CardContent>
              <CardFooter className="mt-auto flex flex-wrap items-center gap-1.5 pt-0">
                {a.tools.map((t) => (
                  <Badge key={t} variant="outline" className="text-[10px]">
                    {t}
                  </Badge>
                ))}
                <Link href={`/agents/new?template=${a.name.toLowerCase().replace(/ /g, "-")}`} className="ml-auto">
                  <Button size="sm" className="group gap-1 bg-gradient-to-r from-violet-600 to-indigo-600 shadow-md shadow-violet-600/20">
                    Use Agent <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}