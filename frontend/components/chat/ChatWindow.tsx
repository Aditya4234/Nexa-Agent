"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Bot } from "lucide-react";
import { api, streamChat } from "@/lib/api";
import { useChat } from "@/stores/chat";
import { ApprovalCard, type PendingApproval } from "./ApprovalCard";
import { ChatInput } from "./ChatInput";
import { ChatMessage } from "./ChatMessage";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import type { Agent, ChatMessage as ChatMessageType, Plugin, TimelineStep, ToolInfo } from "@/types";

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

  const { data: agents = [] } = useQuery<Agent[]>({ queryKey: ["agents"], queryFn: () => api.get("/api/agents") });
  const { data: tools = [] } = useQuery<ToolInfo[]>({ queryKey: ["tools"], queryFn: () => api.get("/api/runs/meta/tools") });
  const { data: plugins = [] } = useQuery<Plugin[]>({ queryKey: ["plugins"], queryFn: () => api.get("/api/plugins") });

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

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
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
          appendAssistant(msgId, `\n\n**Error:** ${err?.detail?.message || err?.message || "Request failed."}`);
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
    <div className="flex h-full flex-col">
      <ScrollArea ref={scrollRef} className="flex-1">
        <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Bot className="h-7 w-7" />
              </div>
              <h2 className="text-xl font-semibold tracking-tight">What can I help you build?</h2>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Give agents a goal. I can plan, search the web, run code, analyze files, and coordinate multiple agents to complete complex tasks.
              </p>
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