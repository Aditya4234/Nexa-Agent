"use client";

import { useState } from "react";
import { Bot, ThumbsDown, ThumbsUp, User } from "lucide-react";

import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useChat } from "@/stores/chat";
import { Button } from "@/components/ui/button";
import { Markdown } from "./Markdown";
import { Timeline } from "./Timeline";
import type { ChatMessage as ChatMessageType } from "@/types";

export function ChatMessage({ message }: { message: ChatMessageType }) {
  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";
  const setFeedback = useChat((s) => s.setFeedback);
  const conversationId = useChat((s) => s.conversationId);
  const [saving, setSaving] = useState(false);

  const submitFeedback = async (value: "up" | "down") => {
    if (!message.run_id || message.feedback || saving) return;
    setSaving(true);
    try {
      await api.post("/api/feedback", {
        feedback: value,
        run_id: message.run_id,
        conversation_id: conversationId,
      });
      setFeedback(message.id, value);
    } catch {
      // feedback is best-effort
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={cn("group flex gap-2 sm:gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
      <div
        className={cn(
          "flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg border",
          isUser ? "border-border bg-muted" : "border-primary/20 bg-primary/10 text-primary"
        )}
      >
        {isUser ? <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
      </div>

      <div className={cn("min-w-0 space-y-1.5 max-w-[82%] sm:max-w-[85%]", isUser ? "items-end" : "items-start")}>
        {message.steps && message.steps.length > 0 && <Timeline steps={message.steps} />}
        <div
          className={cn(
            "rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3 text-[13px] sm:text-sm leading-relaxed break-words",
            isUser ? "rounded-tr-sm bg-primary text-primary-foreground" : "rounded-tl-sm border bg-card text-card-foreground"
          )}
        >
          {message.content ? (
            isUser ? (
              <p className="whitespace-pre-wrap">{message.content}</p>
            ) : (
              <Markdown content={message.content} />
            )
          ) : (
            message.streaming && (
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:300ms]" />
              </span>
            )
          )}
        </div>

        {isAssistant && message.run_id && !message.streaming && message.content && (
          <div className="flex items-center gap-1 pl-1 opacity-0 transition-opacity group-hover:opacity-100">
            <Button variant="ghost" size="sm" className="h-6 px-1.5 text-xs" onClick={() => submitFeedback("up")} disabled={!!message.feedback}>
              <ThumbsUp className={cn("h-3.5 w-3.5", message.feedback === "up" && "text-primary")} />
            </Button>
            <Button variant="ghost" size="sm" className="h-6 px-1.5 text-xs" onClick={() => submitFeedback("down")} disabled={!!message.feedback}>
              <ThumbsDown className={cn("h-3.5 w-3.5", message.feedback === "down" && "text-destructive")} />
            </Button>
            {message.feedback && <span className="text-xs text-muted-foreground">Thanks for the feedback</span>}
          </div>
        )}
      </div>
    </div>
  );
}