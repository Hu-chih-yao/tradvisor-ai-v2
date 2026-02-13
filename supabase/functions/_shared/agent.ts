/**
 * TradvisorAI Agentic Loop — OpenAI Responses API with Grok built-in tools.
 *
 * Ported from Python to TypeScript for Supabase Edge Functions (Deno).
 *
 * Architecture:
 *   User gives high-level intent
 *     -> Grok creates a plan (calls update_plan -> returns to us)
 *     -> Grok searches web + executes code AUTOMATICALLY (server-side)
 *     -> Grok calls update_plan to report progress -> returns to us
 *     -> Repeat until plan is_complete
 *     -> Grok produces final analysis text
 *
 * This version streams Server-Sent Events (SSE) back to the frontend.
 */

import { SYSTEM_PROMPT } from "./prompts.ts";
import { ALL_TOOLS, executeFunction, type PlanData } from "./tools.ts";

// ═══════════════════════════════════════════════════════════════
// SSE EVENT TYPES (sent to frontend)
// ═══════════════════════════════════════════════════════════════

export interface SSEEvent {
  type: "plan_update" | "tool_call" | "text_delta" | "done" | "error";
  data: Record<string, unknown>;
}

// ═══════════════════════════════════════════════════════════════
// AGENT CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const MAX_ITERATIONS = 15;

function getConfig() {
  const apiKey = Deno.env.get("XAI_API_KEY");
  if (!apiKey) {
    throw new Error("XAI_API_KEY not set in Supabase secrets");
  }
  return {
    apiKey,
    baseUrl: Deno.env.get("XAI_BASE_URL") || "https://api.x.ai/v1",
    model: Deno.env.get("XAI_MODEL") || "grok-4-1-fast-reasoning",
  };
}

// ═══════════════════════════════════════════════════════════════
// RESPONSES API CLIENT
// ═══════════════════════════════════════════════════════════════

interface ResponseItem {
  type: string;
  // web_search_call fields
  id?: string;
  status?: string;
  // function_call fields
  name?: string;
  arguments?: string;
  call_id?: string;
  // message fields
  content?: Array<{ type: string; text?: string }>;
}

interface APIResponse {
  id: string;
  output: ResponseItem[];
}

async function callResponsesAPI(
  config: ReturnType<typeof getConfig>,
  input: unknown[],
  previousResponseId?: string
): Promise<APIResponse> {
  const body: Record<string, unknown> = {
    model: config.model,
    tools: ALL_TOOLS,
    input,
  };

  if (previousResponseId) {
    body.previous_response_id = previousResponseId;
  }

  const res = await fetch(`${config.baseUrl}/responses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`xAI API error (${res.status}): ${errorText}`);
  }

  return (await res.json()) as APIResponse;
}

// ═══════════════════════════════════════════════════════════════
// AGENT RUNNER (GENERATOR)
// ═══════════════════════════════════════════════════════════════

/**
 * Run the full agentic loop for a user query.
 * Yields SSE events as the agent works.
 *
 * @param userQuery - The user's message
 * @param history - Previous messages in the conversation (for context)
 */
export async function* runAgent(
  userQuery: string,
  history: Array<{ role: string; content: string }> = []
): AsyncGenerator<SSEEvent> {
  const config = getConfig();
  let plan: PlanData | null = null;
  let responseId: string | undefined;
  let fullResponseText = "";

  // Build input messages
  const inputMessages: unknown[] = [
    { role: "system", content: SYSTEM_PROMPT },
    // Include conversation history for context
    ...history.map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
    { role: "user", content: userQuery },
  ];

  for (let iteration = 1; iteration <= MAX_ITERATIONS; iteration++) {
    // ── Call the Responses API ──────────────────────
    let response: APIResponse;
    try {
      response = await callResponsesAPI(config, inputMessages, responseId);
      responseId = response.id;
    } catch (err) {
      yield {
        type: "error",
        data: { message: `API Error: ${(err as Error).message}` },
      };
      yield {
        type: "done",
        data: { iterations: iteration, plan },
      };
      return;
    }

    // ── Parse output items ──────────────────────────
    const functionCallOutputs: unknown[] = [];

    for (const item of response.output) {
      // --- Built-in: web search executed server-side ---
      if (item.type === "web_search_call") {
        yield {
          type: "tool_call",
          data: { name: "web_search", description: "Searching the web..." },
        };
      }

      // --- Built-in: code interpreter executed server-side ---
      else if (item.type === "code_interpreter_call") {
        yield {
          type: "tool_call",
          data: {
            name: "code_execution",
            description: "Executing Python code...",
          },
        };
      }

      // --- Custom function call (update_plan) ---
      else if (item.type === "function_call") {
        const name = item.name!;
        const args = item.arguments || "{}";
        const callId = item.call_id!;

        let argsDict: Record<string, unknown> = {};
        try {
          argsDict = JSON.parse(args);
        } catch {
          // ignore parse errors
        }

        // Emit tool call event
        yield {
          type: "tool_call",
          data: {
            name,
            description: (argsDict.task_summary as string) || "",
          },
        };

        // Track plan state
        if (name === "update_plan") {
          plan = argsDict as unknown as PlanData;
          yield {
            type: "plan_update",
            data: {
              task_summary: argsDict.task_summary || "",
              steps: argsDict.steps || [],
              is_complete: argsDict.is_complete || false,
            },
          };
        }

        // Execute the custom function
        const result = executeFunction(name, args);

        // Queue the result to send back
        functionCallOutputs.push({
          type: "function_call_output",
          call_id: callId,
          output: result,
        });
      }

      // --- Text message from the model ---
      else if (item.type === "message") {
        for (const part of item.content || []) {
          if (part.type === "output_text" && part.text) {
            fullResponseText += part.text;
            yield {
              type: "text_delta",
              data: { content: part.text },
            };
          }
        }
      }
    }

    // ── Decide whether to continue ──────────────────
    if (functionCallOutputs.length === 0) {
      // No custom function calls -> model is done
      yield {
        type: "done",
        data: { iterations: iteration, plan, fullText: fullResponseText },
      };
      return;
    }

    // Send function results back and continue the loop
    inputMessages.length = 0;
    inputMessages.push(...functionCallOutputs);
  }

  // Max iterations reached
  yield {
    type: "text_delta",
    data: { content: "\n\n(Reached maximum iterations.)" },
  };
  yield {
    type: "done",
    data: { iterations: MAX_ITERATIONS, plan, fullText: fullResponseText },
  };
}
