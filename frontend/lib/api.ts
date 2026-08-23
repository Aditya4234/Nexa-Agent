export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

export class ApiError extends Error {
  status: number;
  detail: any;
  constructor(status: number, detail: any) {
    super(detail?.message || `Request failed (${status})`);
    this.status = status;
    this.detail = detail;
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("nexa_token");
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem("nexa_token", token);
  else localStorage.removeItem("nexa_token");
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (!res.ok) {
    let detail: any = null;
    try {
      detail = await res.json();
    } catch {}
    throw new ApiError(res.status, detail?.error || detail);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: "PUT", body: body ? JSON.stringify(body) : undefined }),
  del: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

export async function uploadFile<T>(path: string, file: File): Promise<T> {
  const form = new FormData();
  form.append("file", file);
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${path}`, { method: "POST", headers, body: form });
  if (!res.ok) {
    let detail: any = null;
    try {
      detail = await res.json();
    } catch {}
    throw new ApiError(res.status, detail?.error || detail);
  }
  return res.json();
}

export type SSEHandler = (event: string, data: any) => void;

export async function streamSSE(
  path: string,
  body: Record<string, unknown>,
  onEvent: SSEHandler,
  signal?: AbortSignal
): Promise<void> {
  const token = getToken();
  if (!token) {
    throw new ApiError(401, { message: "Login required. Please login again." });
  }
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok || !res.body) {
    let detail: any = null;
    try {
      const text = await res.text();
      try {
        detail = JSON.parse(text);
        detail = detail?.error || detail;
      } catch {
        detail = { message: text || `Stream failed (${res.status})` };
      }
    } catch {
      detail = { message: `Stream failed (${res.status})` };
    }
    throw new ApiError(res.status, detail);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() || "";
    for (const part of parts) {
      const eventLine = part.split("\n").find((l) => l.startsWith("event: "));
      const dataLine = part.split("\n").find((l) => l.startsWith("data: "));
      if (!eventLine || !dataLine) continue;
      const event = eventLine.slice(7).trim();
      try {
        onEvent(event, JSON.parse(dataLine.slice(6).trim()));
      } catch {}
    }
  }
}

export async function streamChat(body: Record<string, unknown>, onEvent: SSEHandler, signal?: AbortSignal): Promise<void> {
  return streamSSE("/api/chat", body, onEvent, signal);
}