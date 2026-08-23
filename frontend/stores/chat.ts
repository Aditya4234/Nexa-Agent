import { create } from "zustand";

export interface TimelineStep {
  id: string;
  label: string;
  status: "running" | "completed" | "failed" | "pending";
  detail?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  streaming?: boolean;
  steps?: TimelineStep[];
  run_id?: string;
  feedback?: "up" | "down";
}

interface ChatState {
  conversationId: number | null;
  messages: ChatMessage[];
  streaming: boolean;
  selectedAgentId: number | null;
  selectedTools: string[];
  selectedPlugins: string[];
  model: string;
  setConversationId: (id: number | null) => void;
  setModel: (m: string) => void;
  setSelectedAgent: (id: number | null) => void;
  setSelectedTools: (tools: string[]) => void;
  setSelectedPlugins: (plugins: string[]) => void;
  loadMessages: (msgs: ChatMessage[]) => void;
  appendUser: (content: string) => void;
  startAssistant: () => string;
  appendAssistant: (id: string, text: string) => void;
  appendStep: (id: string, step: TimelineStep) => void;
  updateStep: (id: string, stepId: string, status: TimelineStep["status"], detail?: string) => void;
  finishAssistant: (id: string) => void;
  setMessageRun: (id: string, runId: string) => void;
  setFeedback: (id: string, value: "up" | "down") => void;
  setStreaming: (v: boolean) => void;
  reset: () => void;
}

export const useChat = create<ChatState>((set) => ({
  conversationId: null,
  messages: [],
  streaming: false,
  selectedAgentId: null,
  selectedTools: [],
  selectedPlugins: [],
  model: "default",

  setConversationId: (conversationId) => set({ conversationId }),
  setModel: (model) => set({ model }),
  setSelectedAgent: (selectedAgentId) => set({ selectedAgentId }),
  setSelectedTools: (selectedTools) => set({ selectedTools }),
  setSelectedPlugins: (selectedPlugins) => set({ selectedPlugins }),
  loadMessages: (messages) => set({ messages }),
  appendUser: (content) =>
    set((s) => ({ messages: [...s.messages, { id: crypto.randomUUID(), role: "user", content }] })),
  startAssistant: () => {
    const id = crypto.randomUUID();
    set((s) => ({ messages: [...s.messages, { id, role: "assistant", content: "", streaming: true, steps: [] }] }));
    return id;
  },
  appendAssistant: (id, text) =>
    set((s) => ({
      messages: s.messages.map((m) => (m.id === id ? { ...m, content: m.content + text } : m)),
    })),
  appendStep: (id, step) =>
    set((s) => ({
      messages: s.messages.map((m) => (m.id === id ? { ...m, steps: [...(m.steps || []), step] } : m)),
    })),
  updateStep: (id, stepId, status, detail) =>
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === id
          ? { ...m, steps: (m.steps || []).map((st) => (st.id === stepId ? { ...st, status, detail: detail ?? st.detail } : st)) }
          : m
      ),
    })),
  finishAssistant: (id) =>
    set((s) => ({ messages: s.messages.map((m) => (m.id === id ? { ...m, streaming: false } : m)) })),
  setMessageRun: (id, runId) =>
    set((s) => ({ messages: s.messages.map((m) => (m.id === id ? { ...m, run_id: runId } : m)) })),
  setFeedback: (id, value) =>
    set((s) => ({ messages: s.messages.map((m) => (m.id === id ? { ...m, feedback: value } : m)) })),
  setStreaming: (streaming) => set({ streaming }),
  reset: () => set({ conversationId: null, messages: [], streaming: false }),
}));