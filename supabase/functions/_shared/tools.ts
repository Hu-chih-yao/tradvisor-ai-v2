/**
 * Tool definitions for TradvisorAI Agent.
 *
 * Architecture:
 * - Built-in tools (web_search, code_interpreter) run SERVER-SIDE on xAI/Grok
 *   -> No local search or code execution needed!
 *   -> Grok browses actual web pages and runs code in a real sandbox
 * - Custom function tools (update_plan) run locally
 *   -> We handle these in the agentic loop
 *
 * OpenAI Responses API format.
 */

// ═══════════════════════════════════════════════════════════════
// TOOL DEFINITIONS (Responses API format)
// ═══════════════════════════════════════════════════════════════

/** Built-in: Grok searches the web server-side */
export const WEB_SEARCH_TOOL = { type: "web_search" as const };

/** Built-in: Grok executes Python in a sandbox server-side */
export const CODE_INTERPRETER_TOOL = { type: "code_interpreter" as const };

/** Custom: Agent creates/updates execution plan */
export const UPDATE_PLAN_TOOL = {
  type: "function" as const,
  name: "update_plan",
  description:
    "Create or update the execution plan for the current task. " +
    "MUST be called at the START of every task to create a plan. " +
    "Call again after each major step to update progress. " +
    "The user sees this plan in real-time, so make steps clear and concise.",
  parameters: {
    type: "object",
    properties: {
      task_summary: {
        type: "string",
        description: "One-line summary of the overall task",
      },
      steps: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "integer" },
            description: { type: "string" },
            status: {
              type: "string",
              enum: ["pending", "in_progress", "completed", "skipped"],
            },
            result: {
              type: "string",
              description: "Brief result summary (when completed)",
            },
          },
          required: ["id", "description", "status"],
        },
      },
      is_complete: {
        type: "boolean",
        description:
          "Set true when ALL steps are done and final analysis is ready",
      },
      explanation: {
        type: "string",
        description:
          "Optional one-sentence on why this step and how it contributes. Shown to user as 'thinking out loud'.",
      },
    },
    required: ["steps", "is_complete"],
  },
};

/** All tools to pass to the API */
export const ALL_TOOLS = [WEB_SEARCH_TOOL, CODE_INTERPRETER_TOOL, UPDATE_PLAN_TOOL];

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface PlanStep {
  id: number;
  description: string;
  status: "pending" | "in_progress" | "completed" | "skipped";
  result?: string;
}

export interface PlanData {
  task_summary?: string;
  steps: PlanStep[];
  is_complete: boolean;
  explanation?: string;
}

// ═══════════════════════════════════════════════════════════════
// CUSTOM FUNCTION HANDLERS
// ═══════════════════════════════════════════════════════════════

function handleUpdatePlan(_args: string): string {
  return JSON.stringify({
    status: "ok",
    message: "Plan updated. Continue with next step.",
  });
}

const FUNCTION_HANDLERS: Record<string, (args: string) => string> = {
  update_plan: handleUpdatePlan,
};

export function executeFunction(name: string, args: string): string {
  const handler = FUNCTION_HANDLERS[name];
  if (!handler) {
    return JSON.stringify({ error: `Unknown function: ${name}` });
  }
  return handler(args);
}
