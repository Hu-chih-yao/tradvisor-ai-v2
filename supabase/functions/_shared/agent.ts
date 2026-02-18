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
  type: "plan_update" | "tool_call" | "step_activity" | "text_delta" | "done" | "error";
  data: Record<string, unknown>;
}

// ═══════════════════════════════════════════════════════════════
// AGENT CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const MAX_ITERATIONS = 20;

function getConfig() {
  const apiKey = Deno.env.get("XAI_API_KEY");
  if (!apiKey) {
    throw new Error("XAI_API_KEY not set in Supabase secrets");
  }
  return {
    apiKey,
    baseUrl: Deno.env.get("XAI_BASE_URL") || "https://api.x.ai/v1",
    model: Deno.env.get("XAI_MODEL") || "grok-3-mini",
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
  query?: string;
  results?: Array<{ title?: string; url?: string; snippet?: string }>;
  // code_interpreter_call fields
  code?: string;
  language?: string;
  output?: string;
  error?: string;
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
): Promise<{ response: APIResponse; usedPreviousId: boolean }> {
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

    // If error is about image media_type (accumulated images in context),
    // retry without previous_response_id to start fresh context
    if (previousResponseId && errorText.includes("media_type")) {
      console.warn("Retrying without previous_response_id due to image media_type error");
      const retryBody: Record<string, unknown> = {
        model: config.model,
        tools: ALL_TOOLS,
        input,
      };
      const retryRes = await fetch(`${config.baseUrl}/responses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify(retryBody),
      });

      if (!retryRes.ok) {
        const retryErrorText = await retryRes.text();
        throw new Error(`xAI API error (${retryRes.status}): ${retryErrorText}`);
      }

      return { response: (await retryRes.json()) as APIResponse, usedPreviousId: false };
    }

    throw new Error(`xAI API error (${res.status}): ${errorText}`);
  }

  return { response: (await res.json()) as APIResponse, usedPreviousId: !!previousResponseId };
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

  // Build input messages — ensure all content is plain text strings
  // to avoid sending malformed image blocks without media_type
  const sanitizedHistory = history
    .filter((msg) => msg.content && typeof msg.content === "string")
    .map((msg) => ({
      role: msg.role,
      content: typeof msg.content === "string" ? msg.content : String(msg.content),
    }));

  const inputMessages: unknown[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...sanitizedHistory,
    { role: "user", content: userQuery },
  ];

  for (let iteration = 1; iteration <= MAX_ITERATIONS; iteration++) {
    // ── Call the Responses API ──────────────────────
    let response: APIResponse;
    try {
      const result = await callResponsesAPI(config, inputMessages, responseId);
      response = result.response;
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
          data: { name: "web_search", description: item.query || "Searching the web..." },
        };

        // Emit search query as activity
        if (item.query) {
          yield {
            type: "step_activity",
            data: {
              activity_type: "search",
              content: item.query,
              metadata: { search_query: item.query }
            }
          };
        }

        // Emit search results as activities
        if (item.results && item.results.length > 0) {
          const summary = item.results.slice(0, 3).map(r => r.title || r.snippet).filter(Boolean).join(", ");
          if (summary) {
            yield {
              type: "step_activity",
              data: {
                activity_type: "info",
                content: `Found: ${summary.substring(0, 150)}${summary.length > 150 ? "..." : ""}`
              }
            };
          }
        }
      }

      // --- Built-in: code interpreter executed server-side ---
      else if (item.type === "code_interpreter_call") {
        yield {
          type: "tool_call",
          data: {
            name: "code_execution",
            description: item.code
              ? item.code.split("\n").find((l: string) => l.trim())?.substring(0, 70) || "Running analysis..."
              : "Running analysis...",
          },
        };

        // Emit code as activity
        if (item.code) {
          yield {
            type: "step_activity",
            data: {
              activity_type: "code",
              content: item.code,
              metadata: { language: item.language || "python" }
            }
          };
        }

        // Emit output as activity
        if (item.output) {
          yield {
            type: "step_activity",
            data: {
              activity_type: "output",
              content: item.output.substring(0, 300) // Limit output length
            }
          };
        }

        // Emit error as activity
        if (item.error) {
          yield {
            type: "step_activity",
            data: {
              activity_type: "info",
              content: `⚠️ Error: ${item.error}`
            }
          };
        }
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
