/**
 * TradvisorAI Chat Edge Function
 *
 * POST /chat
 * - Authenticates user via Supabase JWT
 * - Creates or continues a chat session
 * - Runs the AI agent loop
 * - Streams SSE events back to the frontend
 * - Saves messages to the database
 *
 * Request body:
 * {
 *   session_id?: string,   // omit to create new session
 *   message: string        // user's message
 * }
 *
 * Response: Server-Sent Events stream
 * event: plan_update | tool_call | text_delta | done | error
 * data: { ... }
 */

import { corsHeaders } from "../_shared/cors.ts";
import { createAdminClient, getUser } from "../_shared/supabase-admin.ts";
import { runAgent } from "../_shared/agent.ts";

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    // ── Authenticate ──────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const user = await getUser(authHeader);
    const supabase = createAdminClient();

    // ── Parse request ─────────────────────────────────
    const { session_id, message } = await req.json();

    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Get or create session ─────────────────────────
    let sessionId = session_id;

    if (!sessionId) {
      // Create new session with first few words as title
      const title =
        message.length > 50 ? message.substring(0, 50) + "..." : message;

      const { data: session, error: sessionError } = await supabase
        .from("chat_sessions")
        .insert({
          user_id: user.id,
          title,
        })
        .select("id")
        .single();

      if (sessionError) {
        throw new Error(`Failed to create session: ${sessionError.message}`);
      }

      sessionId = session.id;
    } else {
      // Verify session belongs to user
      const { data: session, error: verifyError } = await supabase
        .from("chat_sessions")
        .select("id")
        .eq("id", sessionId)
        .eq("user_id", user.id)
        .single();

      if (verifyError || !session) {
        return new Response(JSON.stringify({ error: "Session not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ── Save user message ─────────────────────────────
    await supabase.from("chat_messages").insert({
      session_id: sessionId,
      role: "user",
      content: message,
    });

    // ── Load conversation history ─────────────────────
    const { data: historyMessages } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })
      .limit(20); // Keep context window manageable

    const history = (historyMessages || []).slice(0, -1); // Exclude the message we just inserted

    // ── Stream agent response via SSE ─────────────────
    const encoder = new TextEncoder();
    let fullResponseText = "";

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send session_id first so frontend knows which session
          const sessionEvent = `event: session\ndata: ${JSON.stringify({ session_id: sessionId })}\n\n`;
          controller.enqueue(encoder.encode(sessionEvent));

          // Run agent loop
          for await (const event of runAgent(message, history)) {
            // Collect full text for saving
            if (event.type === "text_delta") {
              fullResponseText += (event.data.content as string) || "";
            }

            // Send SSE event
            const sseData = `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`;
            controller.enqueue(encoder.encode(sseData));
          }

          // ── Save assistant message ────────────────────
          if (fullResponseText) {
            await supabase.from("chat_messages").insert({
              session_id: sessionId,
              role: "assistant",
              content: fullResponseText,
            });

            // Update session title if it's the first exchange
            if (history.length === 0) {
              // Use first line of response as better title, or keep user message
              const betterTitle =
                message.length > 60
                  ? message.substring(0, 60) + "..."
                  : message;
              await supabase
                .from("chat_sessions")
                .update({ title: betterTitle })
                .eq("id", sessionId);
            }
          }
        } catch (err) {
          const errorEvent = `event: error\ndata: ${JSON.stringify({ message: (err as Error).message })}\n\n`;
          controller.enqueue(encoder.encode(errorEvent));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
