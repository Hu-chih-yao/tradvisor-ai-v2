/**
 * Shared TypeScript types for TradvisorAI.
 */

// ═══════════════════════════════════════════════════════════════
// DATABASE TYPES
// ═══════════════════════════════════════════════════════════════

export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

// ═══════════════════════════════════════════════════════════════
// AGENT EVENT TYPES (from SSE stream)
// ═══════════════════════════════════════════════════════════════

export interface PlanStep {
  id: number;
  description: string;
  status: "pending" | "in_progress" | "completed" | "skipped";
  result?: string;
  // Cursor-style detailed activity logs
  activities?: StepActivity[];
}

export interface StepActivity {
  type: "code" | "search" | "output" | "info";
  content: string;
  timestamp?: number;
  metadata?: {
    language?: string; // for code blocks
    search_query?: string; // for search results
    url?: string; // for citations
    [key: string]: unknown;
  };
}

export interface PlanUpdateEvent {
  task_summary: string;
  steps: PlanStep[];
  is_complete: boolean;
}

export interface ToolCallEvent {
  name: string;
  description: string;
}

export interface TextDeltaEvent {
  content: string;
}

export interface DoneEvent {
  iterations: number;
  plan: PlanUpdateEvent | null;
  fullText?: string;
}

export interface ErrorEvent {
  message: string;
}

// ═══════════════════════════════════════════════════════════════
// LIVE EVENT FEED (like demo.py >> Web Search >> Code Execution)
// ═══════════════════════════════════════════════════════════════

/**
 * One entry in the live event feed shown below the plan checklist.
 * Each tool call (web_search, code_execution) starts a new LiveEvent block.
 * Subsequent step_activity events attach as details inside that block.
 */
export interface LiveEvent {
  id: string;
  tool: "web_search" | "code_execution" | string;
  description: string; // actual search query or first code line
  details: StepActivity[]; // results, output, info that follow
}

// ═══════════════════════════════════════════════════════════════
// UI STATE TYPES
// ═══════════════════════════════════════════════════════════════

export interface UIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  plan?: PlanUpdateEvent;
  liveEvents?: LiveEvent[]; // inline event stream (replaces toolCalls + nested activities)
  toolCalls?: ToolCallEvent[];
  isStreaming?: boolean;
}
