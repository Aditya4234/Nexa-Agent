export interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
}

export interface Conversation {
  id: number;
  title: string;
  model: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: number;
  role: string;
  content: string;
  event_type: string;
  metadata_: Record<string, unknown>;
  created_at: string;
}

export interface ConversationDetail extends Conversation {
  messages: Message[];
}

export interface Agent {
  id: number;
  name: string;
  description: string;
  system_prompt: string;
  model: string;
  temperature: number;
  max_tokens: number;
  tools: string[];
  memory_enabled: boolean;
  max_steps: number;
  timeout: number;
  fallback_model: string;
  is_system: boolean;
  icon: string;
  project_id?: number | null;
  created_at: string;
}

export interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  tools: string[];
  system_prompt: string;
}

export interface AgentRun {
  id: string;
  agent_id: number | null;
  conversation_id?: number | null;
  status: string;
  input: string;
  result: string;
  error: string | null;
  model: string;
  tokens: number;
  cost: number;
  duration_ms: number;
  steps: Array<{ name: string; status: string; detail?: string }>;
  tools_used: string[];
  created_at: string;
}

export interface ToolInfo {
  id: string;
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
  requires_approval: boolean;
}

export interface DashboardStats {
  active_agents: number;
  conversations: number;
  total_executions: number;
  running_tasks: number;
  completed_tasks: number;
  success_rate: number;
  token_usage: number;
  estimated_cost: number;
  tool_calls: number;
  recent_runs: Array<{
    id: string;
    status: string;
    model: string;
    created_at: string;
    tokens: number;
    cost: number;
    input: string;
    agent_id: number | null;
  }>;
  activity: Array<{ date: string; messages: number }>;
}

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

export interface Document {
  id: number;
  title: string;
  content: string;
  format: string;
  created_at: string;
  updated_at: string;
}

export interface Plugin {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  scopes: string[];
  requires_approval: boolean;
  enabled: boolean;
  connected: boolean;
}

export interface LLMConfig {
  provider: string;
  model: string;
  base_url: string;
  embedding_model: string;
  api_key_masked: string;
  configured: boolean;
  source: string;
  active_global: boolean;
}

export interface LLMTestResult {
  ok: boolean;
  message: string;
  latency_ms: number | null;
}

export interface KnowledgeDoc {
  id: number;
  name: string;
  file_type: string;
  size: number;
  chunk_count: number;
  status: string;
  error: string | null;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeSearchResult {
  content: string;
  doc_name: string;
  chunk_index: number;
  score: number;
}

export interface ApiKey {
  id: number;
  name: string;
  prefix: string;
  revoked: boolean;
  last_used_at: string | null;
  created_at: string;
}

export interface ApiKeyCreated extends ApiKey {
  key: string;
}

export interface Project {
  id: number;
  name: string;
  description: string;
  icon: string;
  created_at: string;
  updated_at: string;
  agent_count?: number;
  conversation_count?: number;
}

export interface Feedback {
  id: number;
  message_id: number | null;
  run_id: string | null;
  feedback: "up" | "down";
  comment: string;
  created_at: string;
}

export interface Notification {
  id: number;
  title: string;
  body: string;
  type: string;
  link: string;
  read: boolean;
  created_at: string;
}

export interface Approval {
  id: number;
  run_id: string;
  tool_id: string;
  args: Record<string, unknown>;
  reason: string;
  status: "pending" | "approved" | "rejected" | "timed_out";
  created_at: string;
}

export interface Evaluation {
  id: number;
  name: string;
  description: string;
  agent_id: number | null;
  model: string;
  created_at: string;
}

export interface EvalRun {
  id: number;
  evaluation_id: number;
  status: string;
  passed: number;
  failed: number;
  total: number;
  results: string | Array<{ input: string; expected: string; actual: string; passed: boolean; overlap: number }>;
  created_at: string;
}

export interface WorkflowRun {
  run_id: string;
  conversation_id: number;
  status: string;
  steps: Array<{ name: string; status: string }>;
  specialist_outputs: Record<string, string>;
  result: string;
  model: string;
  tokens: number;
  cost: number;
}

export interface AnalyticsDaily {
  date: string;
  runs: number;
  tokens: number;
  completed: number;
  failed: number;
}

export interface AnalyticsData {
  daily: AnalyticsDaily[];
  total_runs: number;
  completed_runs: number;
  success_rate: number;
  avg_latency_ms: number;
  avg_tokens_per_run: number;
  total_tokens: number;
  total_cost: number;
  tool_calls: number;
  feedback: { up: number; down: number };
  tool_usage: Array<{ tool_id: string; count: number }>;
  model_distribution: Array<{ model: string; count: number }>;
  status_distribution: Array<{ status: string; count: number }>;
}

export interface GeneratedSite {
  id: number;
  name: string;
  prompt: string;
  html: string;
  share_id: string;
  model: string;
  created_at: string;
  updated_at: string;
}

export interface SiteSummary {
  id: number;
  name: string;
  prompt: string;
  share_id: string;
  model: string;
  created_at: string;
  updated_at: string;
}

export interface LogEntry {
  id: string;
  level: "info" | "error";
  source: string;
  message: string;
  detail: string;
  run_id: string;
  created_at: string | null;
}