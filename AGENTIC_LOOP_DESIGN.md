# Agentic Loop Design: Cursor-Style Closed Loop
## Stateful Planning + Autonomous Tool Execution

**Date**: February 2, 2026

---

## How Cursor's Agentic Loop Actually Works

```
User: "Refactor the auth module to use JWT"

Cursor internally:
┌─────────────────────────────────────────────┐
│ 1. PLAN (TodoWrite tool)                    │
│    □ Read current auth code                 │
│    □ Understand existing session logic       │
│    □ Design JWT implementation               │
│    □ Update auth middleware                  │
│    □ Update login/logout routes              │
│    □ Update tests                            │
│    □ Verify it works                         │
└─────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────┐
│ 2. EXECUTE (Loop until done)                │
│                                              │
│  Step 1: read_file("auth/middleware.ts")     │
│    → Updates plan: ■ Read current auth code  │
│                                              │
│  Step 2: read_file("auth/session.ts")        │
│    → "Hmm, also uses cookies. Need to       │
│       handle that too."                       │
│    → Updates plan: adds "migrate cookies"     │
│                                              │
│  Step 3: write_file("auth/jwt.ts")           │
│    → Creates new JWT utility                  │
│    → Updates plan: ■ Design JWT              │
│                                              │
│  Step 4: write_file("auth/middleware.ts")     │
│    → Updates middleware                        │
│    → Updates plan: ■ Update middleware         │
│                                              │
│  ... continues until all steps ■ ...          │
│                                              │
│  Step N: terminal("npm test")                 │
│    → Tests pass!                              │
│    → Updates plan: ■ Verify it works          │
└─────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────┐
│ 3. DONE                                      │
│    All steps completed. Report to user.      │
└─────────────────────────────────────────────┘
```

**Key pattern**: Plan → Execute → Update plan → Execute → ... → Done

---

## Our Agent: Same Pattern, Financial Domain

```
User: "Find me undervalued semiconductor stocks"

Agent internally:
┌─────────────────────────────────────────────┐
│ 1. PLAN (planning tool)                      │
│    □ Get list of semiconductor stocks        │
│    □ Quick screen for candidates             │
│    □ Deep dive top candidates                │
│    □ Calculate DCF for each                  │
│    □ Check sentiment / red flags             │
│    □ Rank by upside potential                │
│    □ Present findings with evidence           │
└─────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────┐
│ 2. EXECUTE (Loop)                            │
│                                              │
│  Step 1: web_search("semiconductor stocks    │
│           list S&P 500")                     │
│    → Gets: NVDA, AMD, INTC, QCOM, AVGO...   │
│    → Plan: ■ Get list (found 15 stocks)      │
│                                              │
│  Step 2: web_search("INTC PE ratio market    │
│           cap growth")                        │
│    + web_search("AMD PE ratio...")            │
│    + web_search("QCOM PE ratio...")           │
│    → Quick metrics for all 15                 │
│    → Plan: ■ Quick screen                     │
│    → "5 look interesting: INTC, MU, QCOM,    │
│       ON, MCHP - low PE + decent growth"      │
│                                              │
│  Step 3: web_search("INTC cash flow 10-K")   │
│    → Gets OCF, CapEx, debt, shares            │
│    → Plan: ■ Deep dive (1/5: INTC)           │
│                                              │
│  Step 4: code_execution("""                   │
│    # DCF for INTC                             │
│    fcfe = 11.5e9                              │
│    growth = 0.08  # Turnaround story          │
│    wacc = 0.095                               │
│    ...calculate intrinsic value...            │
│    """)                                       │
│    → INTC fair value: $42, current: $28       │
│    → Plan: ■ DCF for INTC (50% upside!)       │
│                                              │
│  Step 5: x_search("INTC Intel stock")         │
│    → Sentiment: Mixed, turnaround uncertain   │
│    → Plan: ■ Sentiment check INTC             │
│                                              │
│  ... repeats for MU, QCOM, ON, MCHP ...       │
│                                              │
│  Step 10: code_execution("""                  │
│    # Rank all 5 by risk-adjusted upside       │
│    results = [                                │
│      {'INTC': 50%, 'confidence': 'medium'},   │
│      {'MU': 35%, 'confidence': 'high'},       │
│      ...                                      │
│    ]                                          │
│    """)                                       │
│    → Plan: ■ Rank by upside                   │
│                                              │
│  Step 11: Synthesize final report              │
│    → Plan: ■ Present findings                  │
└─────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────┐
│ 3. DONE - All steps ■                        │
│                                              │
│  "I analyzed 15 semiconductor stocks.         │
│   Top 3 undervalued:                          │
│   1. INTC - 50% upside (turnaround + fabs)    │
│   2. MU - 35% upside (memory cycle)           │
│   3. ON - 28% upside (EV chip demand)         │
│                                              │
│   [Full DCF details, code, sources below]"    │
└─────────────────────────────────────────────┘
```

---

## Implementation: The Agentic Loop

### How Grok's API Actually Handles This

Important distinction with Grok:
- **Built-in tools** (`web_search`, `code_execution`, `x_search`, `collections_search`) execute **server-side automatically** - Grok calls them, gets results, and continues thinking
- **Custom tools** (`save_analysis`, `update_plan`) pause and **return to your code** for execution

This means the loop is partially automatic:

```python
import json
from xai_sdk import Client
from xai_sdk.chat import user, system, tool, tool_result
from xai_sdk.tools import web_search, x_search, code_execution

client = Client(api_key=os.getenv("XAI_API_KEY"))

# The planning tool (like Cursor's TodoWrite)
planning_tool = tool(
    name="update_plan",
    description="""Update the execution plan for the current task. 
    Call this at the START to create a plan, and after each major step 
    to track progress. The user sees this plan in real-time.""",
    parameters={
        "type": "object",
        "properties": {
            "task_summary": {
                "type": "string",
                "description": "One-line summary of the overall task"
            },
            "steps": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "id": {"type": "integer"},
                        "description": {"type": "string"},
                        "status": {
                            "type": "string",
                            "enum": ["pending", "in_progress", "completed", "skipped"]
                        },
                        "result": {
                            "type": "string",
                            "description": "Brief summary of what was found/done"
                        }
                    },
                    "required": ["id", "description", "status"]
                }
            },
            "current_step": {"type": "integer"},
            "is_complete": {"type": "boolean"}
        },
        "required": ["steps", "current_step", "is_complete"]
    },
)

# Save analysis tool (writes to Supabase)
save_tool = tool(
    name="save_analysis",
    description="Save a completed analysis to the user's account in Supabase",
    parameters={
        "type": "object",
        "properties": {
            "ticker": {"type": "string"},
            "verdict": {"type": "string"},
            "fair_value_low": {"type": "number"},
            "fair_value_high": {"type": "number"},
            "fair_value_base": {"type": "number"},
            "upside_pct": {"type": "number"},
            "analysis_json": {"type": "string"},
        },
        "required": ["ticker", "verdict", "analysis_json"]
    },
)

SYSTEM_PROMPT = """
You are a senior equity research analyst AI agent.

## How You Work (IMPORTANT)

You operate in an AGENTIC LOOP. When the user gives you a task:

1. PLAN FIRST: Call update_plan to create a step-by-step plan.
   The user sees this plan in real-time, so make it clear.

2. EXECUTE EACH STEP: Use your tools to complete each step.
   - web_search: Fetch financial data from the web
   - x_search: Get market sentiment from X
   - code_execution: Run Python for calculations
   - collections_search: Search uploaded SEC filings

3. UPDATE PLAN: After each major step, call update_plan to 
   mark it complete and note what you found.

4. ADAPT: If you discover something unexpected, update your 
   plan. Add steps, skip steps, or change approach.

5. FINISH: When all steps are done, present your final analysis.

## Important Rules for the Loop

- Always start with update_plan before doing anything
- Don't try to do everything in one giant step
- Break complex tasks into 5-10 clear steps
- Update the plan after EACH step (the user is watching)
- If a web search fails, try a different query
- If data seems wrong, cross-verify with another source
- Show your work (use code_execution for all calculations)

## Financial Methodology
... (DCF knowledge, PE analysis, moat framework, etc.)
"""


# ═══════════════════════════════════════════
# THE AGENTIC LOOP
# ═══════════════════════════════════════════

async def run_agent(user_message: str, user_id: str):
    """
    Run the agentic loop until the task is complete.
    This is our equivalent of Cursor's agent loop.
    """
    
    chat = client.chat.create(
        model="grok-4-1-fast-reasoning",
        system=SYSTEM_PROMPT,
        tools=[
            web_search(),        # Built-in (auto-executes)
            x_search(),          # Built-in (auto-executes)
            code_execution(),    # Built-in (auto-executes)
            planning_tool,       # Custom (we handle)
            save_tool,           # Custom (we handle)
        ],
    )
    
    chat.append(user(user_message))
    
    # State
    current_plan = None
    max_iterations = 20  # Safety limit
    iteration = 0
    
    while iteration < max_iterations:
        iteration += 1
        
        # Stream the response
        async for response, chunk in chat.stream():
            
            # Built-in tools (web_search, code_execution, x_search)
            # execute AUTOMATICALLY on Grok's servers.
            # We just see them happening in the stream.
            for tc in chunk.tool_calls:
                if tc.function.name in ["web_search", "code_execution", 
                                         "x_search", "collections_search"]:
                    # These are server-side - just log them
                    yield {
                        "type": "tool_call",
                        "tool": tc.function.name,
                        "args": tc.function.arguments
                    }
            
            # Stream text to user
            if chunk.content:
                yield {
                    "type": "text",
                    "content": chunk.content
                }
        
        # Check if there are custom tool calls to handle
        if not response.tool_calls:
            # No more tool calls - agent is done
            break
        
        # Handle custom tool calls
        chat.append(response)
        
        has_custom_calls = False
        for tc in response.tool_calls:
            name = tc.function.name
            args = json.loads(tc.function.arguments)
            
            if name == "update_plan":
                has_custom_calls = True
                current_plan = args
                
                # Send plan update to frontend in real-time
                yield {
                    "type": "plan_update",
                    "plan": current_plan
                }
                
                # Return success to agent
                chat.append(tool_result({
                    "status": "ok",
                    "message": "Plan updated. User can see it. Continue."
                }))
                
                # Check if agent says it's complete
                if args.get("is_complete"):
                    break
            
            elif name == "save_analysis":
                has_custom_calls = True
                # Save to Supabase
                result = await supabase.table("saved_analyses").insert({
                    "user_id": user_id,
                    "ticker": args["ticker"],
                    "verdict": args["verdict"],
                    "fair_value_low": args.get("fair_value_low"),
                    "fair_value_high": args.get("fair_value_high"),
                    "fair_value_base": args.get("fair_value_base"),
                    "analysis_json": args["analysis_json"],
                }).execute()
                
                chat.append(tool_result({
                    "status": "saved",
                    "id": result.data[0]["id"]
                }))
                
                yield {
                    "type": "analysis_saved",
                    "ticker": args["ticker"]
                }
        
        if not has_custom_calls:
            break
        
        if current_plan and current_plan.get("is_complete"):
            break
    
    # Return final state
    yield {
        "type": "done",
        "plan": current_plan,
        "iterations": iteration
    }
```

---

## What the User Sees (Frontend)

```
┌─────────────────────────────────────────────────────┐
│  💬 Chat                                             │
│                                                      │
│  You: Find me undervalued semiconductor stocks       │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │  📋 Execution Plan                             │  │
│  │                                                │  │
│  │  Task: Find undervalued semiconductor stocks   │  │
│  │                                                │  │
│  │  ■ Get semiconductor stock list (15 found)     │  │
│  │  ■ Quick valuation screen (5 candidates)       │  │
│  │  ■ Deep dive: INTC (50% upside)               │  │
│  │  ■ Deep dive: MU (35% upside)                 │  │
│  │  ▶ Deep dive: QCOM (in progress...)           │  │
│  │  □ Deep dive: ON                               │  │
│  │  □ Deep dive: MCHP                             │  │
│  │  □ Check sentiment & red flags                 │  │
│  │  □ Final ranking & report                      │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  🔍 Searching: "QCOM Qualcomm cash flow 10-K"       │
│  💻 Running Python: calculating DCF for QCOM...      │
│                                                      │
│  [streaming results appear here as agent works]      │
│                                                      │
└─────────────────────────────────────────────────────┘
```

The user can see:
1. **The plan** - what the agent is doing (updated in real-time)
2. **Tool calls** - which searches/calculations are happening
3. **Progress** - checkmarks as steps complete
4. **The final output** - when the agent finishes

**This is exactly like watching Cursor work** - you see the plan, the file edits, and the progress.

---

## Generalization: Any Financial Task

Because the agent has knowledge + generic tools, it can handle ANY task:

### Task: "Analyze NVDA"
```
Plan:
1. Fetch NVDA financials (web_search)
2. Get cash flow data (web_search)
3. Calculate DCF (code_execution)
4. Check sentiment (x_search)
5. Synthesize report
```

### Task: "Compare AAPL vs MSFT"
```
Plan:
1. Fetch AAPL financials (web_search)
2. Fetch MSFT financials (web_search)
3. Calculate metrics for both (code_execution)
4. Side-by-side comparison (code_execution)
5. Qualitative comparison (web_search for news)
6. Verdict
```

### Task: "Is the EV market overvalued?"
```
Plan:
1. Get list of EV companies (web_search)
2. Fetch key metrics for each (web_search)
3. Industry-level analysis (code_execution)
4. Compare to traditional auto (web_search + code)
5. Market sentiment (x_search)
6. Thesis presentation
```

### Task: "Build me a dividend portfolio"
```
Plan:
1. Search for high-dividend stocks (web_search)
2. Filter for sustainability (code_execution)
3. Check dividend history (web_search)
4. Calculate yield + growth (code_execution)
5. Diversification check (code_execution)
6. Portfolio recommendation
```

### Task: "What happened to CRM today?"
```
Plan:
1. Get CRM price action (web_search)
2. Find news catalyst (web_search)
3. Check X reactions (x_search)
4. Quick impact analysis (code_execution)
5. Explain to user
```

**Same agent. Same tools. Different plans.** Like Cursor handling any codebase.

---

## The Planning Tool in Detail

The planning tool is critical. It's what makes it feel "agentic" vs just "chatty."

### Plan States:

```
□ pending      - Not started yet
▶ in_progress  - Currently working on this
■ completed    - Done, with result
⊘ skipped      - Decided to skip (with reason)
```

### Plan Adaptation (Key Feature):

The agent can MODIFY the plan mid-execution:

```
Original Plan:
1. ■ Get stock list (found 15)
2. ■ Quick screen (5 candidates)
3. ▶ Deep dive INTC

Agent discovers: "INTC just had an earnings miss yesterday!"

Updated Plan:
1. ■ Get stock list (found 15)
2. ■ Quick screen (5 candidates)
3. ■ Deep dive INTC
4. NEW: Check INTC earnings impact (added!)
5. □ Deep dive MU
...
```

This is exactly what Cursor does - it adapts its plan based on what it finds.

### Plan JSON Structure:

```json
{
  "task_summary": "Find undervalued semiconductor stocks",
  "steps": [
    {
      "id": 1,
      "description": "Get list of semiconductor stocks",
      "status": "completed",
      "result": "Found 15 semiconductor stocks in S&P 500"
    },
    {
      "id": 2,
      "description": "Quick valuation screen (PE, growth, margins)",
      "status": "completed",
      "result": "5 candidates: INTC, MU, QCOM, ON, MCHP"
    },
    {
      "id": 3,
      "description": "DCF analysis for INTC",
      "status": "in_progress",
      "result": null
    },
    {
      "id": 4,
      "description": "DCF analysis for MU",
      "status": "pending",
      "result": null
    }
  ],
  "current_step": 3,
  "is_complete": false
}
```

---

## Architecture Summary

```
┌─────────────────────────────────────────────────┐
│                   FRONTEND                       │
│  Next.js + Vercel AI SDK                         │
│                                                  │
│  Components:                                     │
│  ├─ ChatInput (user types query)                 │
│  ├─ PlanViewer (shows live plan with ■□▶)        │
│  ├─ ToolCallLog (shows searches/code running)    │
│  ├─ StreamingResponse (final text output)        │
│  └─ AnalysisCard (saved results)                 │
└──────────────────────┬──────────────────────────┘
                       │ SSE / WebSocket stream
                       ↓
┌─────────────────────────────────────────────────┐
│                   BACKEND                        │
│  FastAPI (thin layer)                            │
│                                                  │
│  /api/chat                                       │
│  ├─ Receives user message                        │
│  ├─ Runs agentic loop (the while loop above)     │
│  ├─ Handles custom tool calls:                   │
│  │   ├─ update_plan → send to frontend           │
│  │   └─ save_analysis → write to Supabase        │
│  ├─ Streams everything to frontend               │
│  └─ Stops when plan is_complete or max_iterations│
│                                                  │
│  /api/history                                    │
│  ├─ Get past conversations from Supabase         │
│  └─ Get saved analyses                           │
└──────────────────────┬──────────────────────────┘
                       │
          ┌────────────┴────────────┐
          ↓                         ↓
┌──────────────────┐      ┌─────────────────┐
│    GROK API      │      │    SUPABASE     │
│                  │      │                 │
│ System prompt:   │      │ user_profiles   │
│  Financial       │      │ conversations   │
│  methodology     │      │ messages        │
│                  │      │ saved_analyses  │
│ Built-in tools:  │      │ portfolios      │
│  web_search ◄────│      │                 │
│  x_search ◄──────│      │ Auth:           │
│  code_execution ◄│      │  Google OAuth   │
│  collections ◄───│      │                 │
│                  │      │                 │
│ Custom tools:    │      │                 │
│  update_plan ────│──→ Frontend (real-time)│
│  save_analysis ──│──→ Supabase           │
└──────────────────┘      └─────────────────┘
```

---

## Comparison: Cursor vs TradvisorAI

| Aspect | Cursor | TradvisorAI |
|--------|--------|-------------|
| **User input** | "Refactor auth module" | "Find undervalued tech stocks" |
| **System prompt** | Coding best practices | Financial methodology (DCF, PE, moat) |
| **Planning tool** | TodoWrite | update_plan |
| **Data tools** | read_file, grep, glob | web_search, x_search, collections_search |
| **Execution tool** | write_file, terminal | code_execution, save_analysis |
| **Loop** | Read → Plan → Edit → Test → Repeat | Search → Plan → Calculate → Verify → Repeat |
| **Adapts?** | Yes (revises plan) | Yes (revises plan) |
| **Shows work?** | Yes (diffs, terminal) | Yes (code blocks, sources) |
| **Generalized?** | Any coding task | Any financial task |

**Same architecture. Different domain.**

---

## What We Need to Build

### Total components:

```
1. System Prompt (~3000 tokens)
   - Financial methodology (DCF, PE, moat, etc.)
   - Agent behavior rules (plan first, show work, cite sources)
   - Output formatting
   
2. Backend (~200 lines Python)
   - FastAPI with one main endpoint
   - Agentic loop (the while loop)
   - Handle custom tool calls
   - Stream to frontend
   
3. Frontend (~500 lines TypeScript)
   - Chat interface
   - Plan viewer component
   - Tool call display
   - Streaming text
   
4. Supabase (5 tables)
   - user_profiles
   - conversations
   - messages
   - saved_analyses
   - portfolios
```

**That's it.** The entire app is maybe 1000 lines of code. Grok does the heavy lifting.
