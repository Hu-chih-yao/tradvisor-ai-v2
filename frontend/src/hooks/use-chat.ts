"use client";

import { useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type {
  UIMessage,
  PlanUpdateEvent,
  ToolCallEvent,
  ChatSession,
} from "@/lib/types";

interface UseChatOptions {
  onSessionCreated?: (sessionId: string) => void;
}

export function useChat(options?: UseChatOptions) {
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<PlanUpdateEvent | null>(null);
  const [currentToolCalls, setCurrentToolCalls] = useState<ToolCallEvent[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const supabase = createClient();

  /**
   * Load an existing session's messages.
   */
  const loadSession = useCallback(
    async (id: string) => {
      setSessionId(id);
      setCurrentPlan(null);
      setCurrentToolCalls([]);

      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("session_id", id)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Failed to load messages:", error);
        return;
      }

      const uiMessages: UIMessage[] = (data || [])
        .filter((m: { role: string }) => m.role !== "system")
        .map((m: { id: string; role: string; content: string }) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content,
        }));

      setMessages(uiMessages);
    },
    [supabase]
  );

  /**
   * Start a new chat session (clear messages).
   */
  const newSession = useCallback(() => {
    setSessionId(null);
    setMessages([]);
    setCurrentPlan(null);
    setCurrentToolCalls([]);
  }, []);

  /**
   * Send a message to the agent and stream the response.
   */
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      // Add user message to UI immediately
      const userMsg: UIMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: content.trim(),
      };

      // Add placeholder assistant message
      const assistantMsg: UIMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
        isStreaming: true,
        toolCalls: [],
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setIsLoading(true);
      setCurrentPlan(null);
      setCurrentToolCalls([]);

      // Get auth token
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        console.error("Not authenticated");
        setIsLoading(false);
        return;
      }

      // Set up abort controller
      abortRef.current = new AbortController();

      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const response = await fetch(
          `${supabaseUrl}/functions/v1/chat`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
              apikey: supabaseAnonKey,
            },
            body: JSON.stringify({
              session_id: sessionId,
              message: content.trim(),
            }),
            signal: abortRef.current.signal,
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // Parse SSE stream
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let accumulatedText = "";
        const accumulatedToolCalls: ToolCallEvent[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || ""; // Keep incomplete line in buffer

          let eventType = "";
          for (const line of lines) {
            if (line.startsWith("event: ")) {
              eventType = line.slice(7).trim();
            } else if (line.startsWith("data: ")) {
              const dataStr = line.slice(6);
              try {
                const data = JSON.parse(dataStr);

                switch (eventType) {
                  case "session": {
                    const newSessionId = data.session_id;
                    setSessionId(newSessionId);
                    options?.onSessionCreated?.(newSessionId);
                    break;
                  }

                  case "plan_update": {
                    const plan = data as PlanUpdateEvent;
                    setCurrentPlan(plan);
                    // Update assistant message with plan
                    setMessages((prev) => {
                      const updated = [...prev];
                      const last = updated[updated.length - 1];
                      if (last.role === "assistant") {
                        last.plan = plan;
                      }
                      return updated;
                    });
                    break;
                  }

                  case "tool_call": {
                    const toolCall = data as ToolCallEvent;
                    if (toolCall.name !== "update_plan") {
                      accumulatedToolCalls.push(toolCall);
                      setCurrentToolCalls([...accumulatedToolCalls]);
                      setMessages((prev) => {
                        const updated = [...prev];
                        const last = updated[updated.length - 1];
                        if (last.role === "assistant") {
                          last.toolCalls = [...accumulatedToolCalls];
                        }
                        return updated;
                      });
                    }
                    break;
                  }

                  case "step_activity": {
                    // Add activity to the currently in-progress step
                    setCurrentPlan((prev) => {
                      if (!prev) return prev;
                      const updated = { ...prev };
                      const inProgressStep = updated.steps.find(
                        (s) => s.status === "in_progress"
                      );
                      if (inProgressStep) {
                        if (!inProgressStep.activities) {
                          inProgressStep.activities = [];
                        }
                        inProgressStep.activities.push({
                          type: data.activity_type as "code" | "search" | "output" | "info",
                          content: data.content as string,
                          timestamp: Date.now(),
                          metadata: data.metadata as Record<string, unknown> | undefined,
                        });
                      }
                      return updated;
                    });
                    // Also update in messages
                    setMessages((prev) => {
                      const updated = [...prev];
                      const last = updated[updated.length - 1];
                      if (last.role === "assistant" && last.plan) {
                        const inProgressStep = last.plan.steps.find(
                          (s) => s.status === "in_progress"
                        );
                        if (inProgressStep) {
                          if (!inProgressStep.activities) {
                            inProgressStep.activities = [];
                          }
                          inProgressStep.activities.push({
                            type: data.activity_type as "code" | "search" | "output" | "info",
                            content: data.content as string,
                            timestamp: Date.now(),
                            metadata: data.metadata as Record<string, unknown> | undefined,
                          });
                        }
                      }
                      return updated;
                    });
                    break;
                  }

                  case "text_delta": {
                    accumulatedText += data.content || "";
                    setMessages((prev) => {
                      const updated = [...prev];
                      const last = updated[updated.length - 1];
                      if (last.role === "assistant") {
                        last.content = accumulatedText;
                      }
                      return updated;
                    });
                    break;
                  }

                  case "done": {
                    setMessages((prev) => {
                      const updated = [...prev];
                      const last = updated[updated.length - 1];
                      if (last.role === "assistant") {
                        last.isStreaming = false;
                      }
                      return updated;
                    });
                    break;
                  }

                  case "error": {
                    setMessages((prev) => {
                      const updated = [...prev];
                      const last = updated[updated.length - 1];
                      if (last.role === "assistant") {
                        last.content =
                          `Error: ${data.message || "Something went wrong"}`;
                        last.isStreaming = false;
                      }
                      return updated;
                    });
                    break;
                  }
                }
              } catch {
                // Ignore JSON parse errors from partial data
              }
            }
          }
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          // User cancelled
        } else {
          console.error("Chat error:", err);
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last?.role === "assistant") {
              last.content = `Error: ${(err as Error).message}`;
              last.isStreaming = false;
            }
            return updated;
          });
        }
      } finally {
        setIsLoading(false);
        abortRef.current = null;
      }
    },
    [isLoading, sessionId, supabase, options]
  );

  /**
   * Stop the current generation.
   */
  const stop = useCallback(() => {
    abortRef.current?.abort();
    setIsLoading(false);
    setMessages((prev) => {
      const updated = [...prev];
      const last = updated[updated.length - 1];
      if (last?.role === "assistant") {
        last.isStreaming = false;
      }
      return updated;
    });
  }, []);

  return {
    messages,
    isLoading,
    currentPlan,
    currentToolCalls,
    sessionId,
    sendMessage,
    loadSession,
    newSession,
    stop,
  };
}
