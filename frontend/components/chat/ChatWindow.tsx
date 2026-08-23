"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Bot, CheckCircle2, KeyRound, Loader2, Settings, X } from "lucide-react";
import { api, streamChat } from "@/lib/api";
import { useChat } from "@/stores/chat";
import { ApprovalCard, type PendingApproval } from "./ApprovalCard";
import { ChatInput } from "./ChatInput";
import { ChatMessage } from "./ChatMessage";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Agent, ChatMessage as ChatMessageType, LLMConfig, Plugin, TimelineStep, ToolInfo } from "@/types";

let stepSeq = 0;
const stepId = () => `step-${++stepSeq}`;

export function ChatWindow() {
  const params = useParams<{ id?: string }>();
  const conversationIdParam = params?.id ? Number(params.id) : null;

  const {
    conversationId,
    setConversationId,
    messages,
    loadMessages,
    streaming,
    setStreaming,
    appendUser,
    startAssistant,
    appendAssistant,
    appendStep,
    updateStep,
    finishAssistant,
    setMessageRun,
    selectedAgentId,
    setSelectedAgent,
    selectedTools,
    setSelectedTools,
    selectedPlugins,
    setSelectedPlugins,
    model,
    setModel,
  } = useChat();

  const abortRef = useRef<AbortController | null>(null);
  const lastStepIdRef = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [pendingApproval, setPendingApproval] = useState<PendingApproval | null>(null);

  const qc = useQueryClient();
  const { data: agents = [] } = useQuery<Agent[]>({ queryKey: ["agents"], queryFn: () => api.get("/api/agents") });
  const { data: tools = [] } = useQuery<ToolInfo[]>({ queryKey: ["tools"], queryFn: () => api.get("/api/runs/meta/tools") });
  const { data: plugins = [] } = useQuery<Plugin[]>({ queryKey: ["plugins"], queryFn: () => api.get("/api/plugins") });
  const { data: llmConfig } = useQuery<LLMConfig>({ queryKey: ["llm-config"], queryFn: () => api.get("/api/settings/llm") });

  // BYO key inline state
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [byoKey, setByoKey] = useState("");
  const [byoProvider, setByoProvider] = useState("openai");
  const [byoSaving, setByoSaving] = useState(false);
  const [byoError, setByoError] = useState("");
  const [byoSuccess, setByoSuccess] = useState(false);

  const isMockMode = llmConfig ? !llmConfig.configured : false;
  const showByoBanner = isMockMode && !bannerDismissed;

  const saveByoKey = async () => {
    const trimmed = byoKey.trim();
    if (!trimmed) {
      setByoError("API key khaali hai. Key paste karo.");
      return;
    }
    setByoSaving(true);
    setByoError("");
    try {
      await api.put("/api/settings/llm", {
        provider: byoProvider,
        api_key: trimmed,
        base_url: "",
        model: "",
        embedding_model: "",
      });
      qc.invalidateQueries({ queryKey: ["llm-config"] });
      setByoSuccess(true);
      setTimeout(() => setByoSuccess(false), 2500);
      setByoKey("");
      setBannerDismissed(true);
    } catch (err: any) {
      setByoError(err?.detail?.message || err?.message || "Save failed");
    } finally {
      setByoSaving(false);
    }
  };

  const { data: conversation, isPending: conversationLoading } = useQuery({
    queryKey: ["conversation", conversationIdParam],
    queryFn: () => api.get<{ messages: ChatMessageType[] }>(`/api/conversations/${conversationIdParam}`),
    enabled: !!conversationIdParam,
  });

  useEffect(() => {
    if (conversation) {
      setConversationId(conversationIdParam!);
      loadMessages(conversation.messages.map((m) => ({ ...m, id: String(m.id), role: m.role as any })));
    }
  }, [conversation, conversationIdParam, loadMessages, setConversationId]);

  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // try both container scroll and anchor scroll for mobile/desktop
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const addStep = useCallback(
    (msgId: string, label: string, status: TimelineStep["status"] = "running") => {
      const id = stepId();
      lastStepIdRef.current = id;
      appendStep(msgId, { id, label, status });
      return id;
    },
    [appendStep]
  );

  const send = useCallback(
    async (text: string) => {
      if (streaming) return;
      appendUser(text);
      const msgId = startAssistant();
      lastStepIdRef.current = null;
      setStreaming(true);
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        await streamChat(
          {
            message: text,
            conversation_id: conversationId,
            agent_id: selectedAgentId,
            model,
            tools: selectedTools,
            plugins: selectedPlugins,
          },
          (event, data) => {
            switch (event) {
              case "conversation.created":
                setConversationId(data.id);
                break;
              case "plan.created":
                (data.steps || []).forEach((s: string) => addStep(msgId, s, "pending"));
                break;
              case "agent.thinking":
                addStep(msgId, data.detail || "Thinking…");
                break;
              case "tool.started":
                addStep(msgId, `Tool: ${data.tool_id}`);
                break;
              case "tool.completed":
                if (lastStepIdRef.current) updateStep(msgId, lastStepIdRef.current, "completed", data.summary);
                break;
              case "agent.message":
                appendAssistant(msgId, data.content);
                break;
              case "agent.completed":
                setMessageRun(msgId, data.run_id);
                break;
              case "approval.required":
                setPendingApproval({ approval_id: data.approval_id, tool_id: data.tool_id, args: data.args || {}, reason: data.reason || "" });
                addStep(msgId, `Approval required: ${data.tool_id}`);
                break;
              case "approval.rejected":
                setPendingApproval(null);
                if (lastStepIdRef.current) updateStep(msgId, lastStepIdRef.current, "failed", "Rejected by user");
                break;
              case "approval.timeout":
                setPendingApproval(null);
                if (lastStepIdRef.current) updateStep(msgId, lastStepIdRef.current, "failed", "Timed out");
                break;
              case "agent.error":
                appendAssistant(msgId, `\n\n**Error:** ${data.message}`);
                if (lastStepIdRef.current) updateStep(msgId, lastStepIdRef.current, "failed", data.message);
                break;
            }
          },
          controller.signal
        );
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          const msg = err?.detail?.message || err?.message || "Request failed.";
          const hint =
            err?.status === 401
              ? "\n\n> Session expired — please **login again**."
              : isMockMode && !llmConfig?.configured
              ? "\n\n> Hint: **Mock mode** me ho. Settings → LLM Provider me API key add karo for real answers (upar banner me bhi add kar sakte ho)."
              : "";
          appendAssistant(msgId, `\n\n**Error:** ${msg}${hint}`);
          if (lastStepIdRef.current) updateStep(msgId, lastStepIdRef.current, "failed", msg);
          if (err?.status === 401) {
            // token expired handling could redirect, but keep soft
          }
        }
      } finally {
        if (lastStepIdRef.current) updateStep(msgId, lastStepIdRef.current, "completed");
        finishAssistant(msgId);
        setStreaming(false);
        setPendingApproval(null);
        abortRef.current = null;
      }
    },
    [
      streaming,
      conversationId,
      selectedAgentId,
      model,
      selectedTools,
      selectedPlugins,
      appendUser,
      startAssistant,
      setStreaming,
      setConversationId,
      addStep,
      appendAssistant,
      updateStep,
      finishAssistant,
      setMessageRun,
      isMockMode,
      llmConfig,
    ]
  );

  const stop = useCallback(() => abortRef.current?.abort(), []);
  const toggleTool = useCallback(
    (id: string) => setSelectedTools(selectedTools.includes(id) ? selectedTools.filter((t) => t !== id) : [...selectedTools, id]),
    [selectedTools, setSelectedTools]
  );
  const togglePlugin = useCallback(
    (id: string) =>
      setSelectedPlugins(selectedPlugins.includes(id) ? selectedPlugins.filter((p) => p !== id) : [...selectedPlugins, id]),
    [selectedPlugins, setSelectedPlugins]
  );

  if (conversationLoading && conversationIdParam) {
    return (
      <div className="space-y-4 p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* BYO Key Banner - visible on mobile & desktop when mock mode */}
      {showByoBanner && (
        <div className="shrink-0 border-b bg-amber-50/90 px-3 py-3 dark:bg-amber-950/30 dark:border-amber-900/50">
          <div className="mx-auto w-full max-w-3xl">
            <div className="flex items-start gap-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Mock mode active — real answers ke liye apni API key add karo</p>
                <p className="mt-0.5 text-xs leading-relaxed text-amber-700/80 dark:text-amber-300/70">
                  Naye chat par answer nahi aa raha kyunki koi LLM key set nahi hai. Neeche apni <strong>OpenAI / Anthropic / OpenRouter / Groq</strong> key paste karo, ya{" "}
                  <Link href="/settings?tab=llm" className="underline underline-offset-2 font-medium">Settings → LLM Provider</Link> me jao.
                </p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <select
                    value={byoProvider}
                    onChange={(e) => setByoProvider(e.target.value)}
                    className="h-8 w-full sm:w-[150px] rounded-md border border-amber-200 bg-white px-2 text-xs outline-none focus:ring-1 focus:ring-amber-400 dark:bg-zinc-900 dark:border-amber-800"
                  >
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic</option>
                    <option value="openai_compatible">OpenAI-compatible</option>
                  </select>
                  <div className="flex flex-1 items-center gap-1.5">
                    <div className="relative flex-1">
                      <KeyRound className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        type="password"
                        value={byoKey}
                        onChange={(e) => setByoKey(e.target.value)}
                        placeholder="sk-…  ya  sk-ant-…  paste karo"
                        className="h-8 pl-8 font-mono text-xs bg-white dark:bg-zinc-900 border-amber-200 dark:border-amber-800"
                        onKeyDown={(e) => e.key === "Enter" && saveByoKey()}
                      />
                    </div>
                    <Button size="sm" className="h-8 shrink-0 gap-1" onClick={saveByoKey} disabled={byoSaving || !byoKey.trim()}>
                      {byoSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />}
                      Save
                    </Button>
                  </div>
                </div>
                {byoError && <p className="mt-2 text-xs text-destructive">{byoError}</p>}
                {byoSuccess && <p className="mt-2 flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="h-3 w-3" /> Saved! Ab naya message bhejo — real model chalega.</p>}
                <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
                  <Link href="/settings?tab=llm" className="inline-flex items-center gap-1 hover:text-foreground"><Settings className="h-3 w-3" /> Advanced settings</Link>
                  <span className="opacity-30">·</span>
                  <button onClick={() => setBannerDismissed(true)} className="hover:text-foreground">Mock mode me hi continue karo</button>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-amber-700/60 hover:text-amber-800" onClick={() => setBannerDismissed(true)} aria-label="Dismiss">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <ScrollArea ref={scrollRef} className="flex-1 min-h-0">
        <div className="mx-auto w-full max-w-3xl space-y-4 sm:space-y-6 px-3 sm:px-4 py-4 sm:py-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-2 sm:px-4 py-8 sm:py-12 text-center">
              <div className="mb-4 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Bot className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
              <h2 className="text-lg sm:text-xl font-semibold tracking-tight">What can I help you build?</h2>
              <p className="mt-2 max-w-md text-xs sm:text-sm text-muted-foreground px-2">
                Give agents a goal. I can plan, search the web, run code, analyze files, and coordinate multiple agents to complete complex tasks.
              </p>
              {!showByoBanner && isMockMode && (
                <div className="mt-4 w-full max-w-md rounded-lg border border-dashed border-amber-300 bg-amber-50/60 p-3 text-left dark:bg-amber-950/20 dark:border-amber-800">
                  <p className="text-xs font-medium text-amber-800 dark:text-amber-300">Tip: Add your API key for real AI answers</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">Settings → LLM Provider me key add karo. Bina key ke sirf mock demo reply milta hai.</p>
                  <Link href="/settings?tab=llm" className="mt-2 inline-flex text-xs font-medium text-primary hover:underline">Go to Settings →</Link>
                </div>
              )}
              <div className="mt-6 grid w-full max-w-md gap-2">
                {[
                  "Build a REST API for an e-commerce app",
                  "Research the latest AI agent frameworks",
                  "Analyze this dataset and chart the results",
                  "Draft a project proposal for autonomous agents",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => send(suggestion)}
                    disabled={streaming}
                    className="rounded-lg border bg-card p-3 text-left text-sm transition-colors hover:bg-accent disabled:opacity-50"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m) => <ChatMessage key={m.id} message={m} />)
          )}
          <div ref={bottomRef} className="h-1" aria-hidden />
        </div>
      </ScrollArea>

      {pendingApproval && <ApprovalCard approval={pendingApproval} onDecided={() => setPendingApproval(null)} />}

      <ChatInput
        onSend={send}
        onStop={stop}
        streaming={streaming}
        agents={agents}
        tools={tools}
        plugins={plugins}
        selectedAgentId={selectedAgentId}
        setSelectedAgentId={setSelectedAgent}
        selectedTools={selectedTools}
        toggleTool={toggleTool}
        selectedPlugins={selectedPlugins}
        togglePlugin={togglePlugin}
        model={model}
        setModel={setModel}
        files={files}
        setFiles={setFiles}
      />
    </div>
  );
}