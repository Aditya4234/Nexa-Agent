"use client";

import { useEffect } from "react";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { useChat } from "@/stores/chat";

export default function NewChatPage() {
  const reset = useChat((s) => s.reset);

  useEffect(() => {
    reset();
  }, [reset]);

  return <ChatWindow />;
}