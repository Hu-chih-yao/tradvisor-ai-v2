# Cursor-Style Agent Optimization Guide

Compare TradvisorAI agent vs Cursor's Agent Prompt v1.2 + Agent Tools v1.0, and how to optimize.

---

## 1. Current State

### Python Agent (`agent/`)
- **agent.py**: Sync Responses API, yields PlanUpdate, ToolCall, TextDelta, Done
- **prompts.py**: ~150 lines, financial methodology + agentic loop
- **tools.py**: `update_plan` (custom), `web_search` + `code_interpreter` (xAI built-ins)
- **demo.py**: Rich terminal UI, plan table, tool indicators

### Supabase Agent (`supabase/functions/_shared/`)
- **agent.ts**: Same logic, non-streaming `responses.create()`, emits SSE events
- **prompts.ts**: Mirrors Python prompts
- **tools.ts**: Same tool definitions

### xAI API Constraints
- `web_search` and `code_interpreter` are **built-in** — we can't change their schema
- Only `update_plan` is our custom function — we control its parameters
- Results come in `response.output` (sync) — streaming may not expose full results

---

## 2. Cursor vs Tradvisor — Key Differences

| Aspect | Cursor | TradvisorAI |
|--------|--------|-------------|
| **Identity** | "AI coding assistant... You are an agent" | "Senior equity research analyst AI agent" |
| **Persistence** | "Keep going until the user's query is completely resolved" | "PLAN → EXECUTE → ADAPT → FINISH" |
| **Tool naming** | "NEVER refer to tool names when speaking to the USER" | Not emphasized |
| **Context** | "Run multiple searches with different wording; first-pass results often miss key details" | "If a search returns poor results, try a different query" |
| **Prompt structure** | XML tags: `<tool_calling>`, `<maximize_context>`, `<making_code_changes>` | Markdown headers |
| **Tool docs** | Per-tool: When to Use / When NOT to Use, examples | Brief descriptions in update_plan |
| **Plan tool** | `todo_write` (task list) | `update_plan` (steps + status) |

---

## 3. Optimization Recommendations

### A. Prompt — Add Cursor-Style Rules

**1. Never refer to tool names**
```
NEVER refer to tool names (web_search, code_execution) when speaking to the user.
Say "Searching for TSLA financials" or "Running the DCF model" — not "Calling web_search".
```

**2. Agentic persistence**
```
You are an agent — keep going until the user's query is completely resolved.
Only terminate when you are sure the analysis is complete. Autonomously resolve the query before yielding.
```

**3. Maximize context (web search)**
```
Be THOROUGH when gathering information. Run multiple searches with different wording;
first-pass results often miss key details. Cross-verify critical numbers from multiple sources.
```

**4. Lean tool docs**
Cursor keeps tool docs in the prompt. For xAI built-ins we can't change schema, but we can add:
```
## web_search
- Use for: stock price, financials, 10-K, news, analyst estimates
- Run multiple queries with different wording when results are thin
- NEVER make up numbers — always source from search

## code_execution
- Use for: ALL calculations (DCF, PE, growth rates)
- NEVER do math in your head — always run Python
```

### B. Tools — Add `explanation` to update_plan

Cursor's tools often have an `explanation` param. Add to `update_plan`:

```json
"explanation": {
  "type": "string",
  "description": "One sentence on why this step and how it contributes to the goal. Shown to user as 'thinking out loud'."
}
```

This gives Cursor-style "I'm doing X because Y" feedback.

### C. Demo / Frontend — Cursor-Like UX

| Cursor shows | Tradvisor has | Gap |
|--------------|---------------|-----|
| Plan / steps | ✅ update_plan | Good |
| "Working" / thinking text | ❌ | Add `explanation` from update_plan |
| Tool blocks (collapsible) | ✅ tool_call | Good |
| Streaming text | ✅ (Supabase) / ❌ (Python sync) | Python: add streaming |
| Parallel tool calls | xAI handles | N/A |

**Demo improvements:**
- Show `explanation` when update_plan has it
- Compact progress: "Step 3 of 8: Fetching TSLA financials" instead of full table every time
- Group consecutive same tool: "Searching web (5×)" not 5 lines

### D. Sync Python vs Supabase

- **Python** uses sync `responses.create()` — gets full output, no streaming
- **Supabase** same — gets full output, streams events to frontend
- Keep prompts identical between `agent/prompts.py` and `supabase/functions/_shared/prompts.ts`

---

## 4. What NOT to Copy from Cursor

- **codebase_search, read_file, grep_search** — Cursor is for code; we use web_search
- **edit_file, run_terminal_cmd** — we don't edit user files
- **todo_write** — we have update_plan; different shape but same purpose
- **memories** — optional; add later if needed
- **XML tags** — Cursor uses them for structure; markdown headers work fine for Grok

---

## 5. Implementation Checklist

- [ ] Add "NEVER refer to tool names" to prompts (Python + Supabase)
- [ ] Add "Keep going until resolved" agentic persistence
- [ ] Add "Run multiple searches with different wording" to web_search guidance
- [ ] Add `explanation` param to update_plan in tools.py + tools.ts
- [ ] Update demo.py to show explanation when present
- [ ] Add compact plan progress (one-line after first full plan)
- [ ] Ensure Python demo and Supabase agent use same prompt text

---

## 6. xAI API Notes

- **Model**: `grok-4-1-fast-reasoning` for tools; `grok-3-mini` does NOT support web_search/code_interpreter
- **Streaming**: `responses.stream()` — text streams, but tool results may only appear in `get_final_response()` at end of iteration
- **Sync**: `responses.create()` — full output with `item.results` for web_search, `item.output` for code_interpreter
