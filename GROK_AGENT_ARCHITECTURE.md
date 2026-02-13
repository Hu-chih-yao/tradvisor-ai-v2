# Grok-Powered Agent Architecture
## The "Cursor for Finance" Design

**Date**: February 2, 2026

---

## The Core Insight

Grok's built-in tools give us everything we need natively:

| Tool | What It Does | Replaces |
|------|-------------|----------|
| `web_search` | Search Yahoo Finance, SEC Edgar, news | yfinance, Tavily, Playwright |
| `x_search` | Market sentiment from X/Twitter | Custom sentiment analysis |
| `code_execution` | Run Python in sandbox | E2B, Modal Labs |
| `collections_search` | RAG over SEC filings | Custom RAG pipeline |
| `function_calling` | Save to Supabase, user data | Custom API endpoints |

**No external services needed.** One API does it all.

---

## The Cursor Analogy (Why This Works)

Let's map it precisely:

### How Cursor Works:
```
System Prompt:
  - Deep knowledge of programming languages
  - Best practices, patterns, conventions
  - Rules for code quality

Tools:
  - read_file (generic)
  - write_file (generic)
  - terminal (generic)
  - web_search (generic)

Workflow:
  User: "Refactor this module"
  Cursor:
    1. Reads files to understand context (read_file)
    2. Reasons about best approach (LLM knowledge)
    3. Writes new code (write_file)
    4. Tests it (terminal)
    5. Iterates if needed (closed loop)

Key: Cursor does NOT have a "refactor_code" tool.
     It has KNOWLEDGE + GENERIC TOOLS.
     The intelligence is in the reasoning, not the tools.
```

### How TradvisorAI Should Work:
```
System Prompt:
  - Deep knowledge of financial analysis
  - DCF methodology, PE analysis, moat analysis
  - Rules for valuation quality

Tools:
  - web_search (generic - Grok built-in)
  - x_search (generic - Grok built-in)
  - code_execution (generic - Grok built-in)
  - collections_search (generic - Grok built-in)
  - save_analysis (custom - saves to Supabase)

Workflow:
  User: "Analyze NVDA"
  Agent:
    1. Searches web for financial data (web_search)
    2. Reasons about valuation approach (LLM knowledge)
    3. Writes Python code to calculate DCF (code_execution)
    4. Gets sentiment from X (x_search)
    5. Synthesizes analysis
    6. Saves if user wants (save_analysis)

Key: Agent does NOT have a "calculate_dcf" tool.
     It has KNOWLEDGE + GENERIC TOOLS.
     The intelligence is in the reasoning, not the tools.
```

**Same pattern. Different domain.**

---

## Your Key Question: Where Does DCF Logic Live?

### Option A: DCF as a Function Tool
```python
# Agent calls this tool with parameters
tool(
    name="calculate_dcf",
    parameters={
        "ticker": "NVDA",
        "growth_rate": 0.35,
        "wacc": 0.10,
        "fcfe": 24900000000
    }
)
# Tool runs fixed calculation, returns result
```

**Problem**: Inflexible. The tool is a black box. Can't adapt per stock. Can't explain WHY it chose those growth rates. Not like Cursor at all - Cursor doesn't have a "refactor" tool, it writes custom code each time.

### Option B: DCF Knowledge in System Prompt + Code Execution
```python
# System prompt contains DCF methodology
# Agent writes custom Python code and executes it

# For a mature company (AAPL):
code = """
fcfe = 111_000_000_000  # From 10-K
growth = 0.08  # Moderate - iPhone mature
wacc = 0.085   # Low risk, strong brand
# ... calculate DCF
"""

# For a high-growth company (NVDA):
code = """
fcfe = 24_900_000_000  # From 10-K
growth = 0.35  # High - AI boom
wacc = 0.10    # Higher risk, concentrated
# ... calculate DCF with fade rate
"""
```

**This is the right approach.** The agent adapts its analysis per stock, just like Cursor writes different code for different situations.

### Option C: Hybrid (What I Recommend)
```
System Prompt:
  Contains DETAILED financial methodology
  (like a CFA textbook in the prompt)

Code Execution:
  Agent writes Python to do the math
  (ensures precision)

Web Search:
  Agent fetches real data
  (growth estimates, comparables, etc.)

Why Hybrid?
  - Knowledge tells agent HOW to analyze
  - Code execution ensures mathematical accuracy
  - Web search provides real-world data
  - Agent REASONS about which approach fits
```

**Answer: DCF methodology goes in the system prompt. The agent uses code_execution to implement it. This is exactly what Cursor does.**

---

## The System Prompt Design

This is the most critical piece. Think of it as the agent's "financial education."

```python
SYSTEM_PROMPT = """
You are a senior equity research analyst and investment advisor.
You have deep expertise in fundamental analysis and valuation.

## Your Capabilities

You can:
1. Search the web for financial data (Yahoo Finance, SEC, news)
2. Search X/Twitter for market sentiment and real-time reactions
3. Execute Python code for precise calculations
4. Search uploaded SEC filings (10-K, 10-Q) for detailed data
5. Save analyses for users

## How You Work

When a user asks about a stock, you:
1. RESEARCH: Gather data from multiple sources
2. REASON: Think through the business and its value
3. CALCULATE: Write and execute code for precise valuations
4. SYNTHESIZE: Combine quantitative + qualitative analysis
5. PRESENT: Explain your reasoning clearly with citations

## Valuation Framework

### DCF (Discounted Cash Flow) - Your Primary Tool

#### Step 1: Calculate Free Cash Flow to Equity (FCFE)
FCFE = Operating Cash Flow - Capital Expenditures + Net Borrowing

Where to find this data:
- Search web: "{ticker} cash flow statement"
- Or search SEC 10-K filing
- Use the most recent annual filing

Important: 
- Operating CF should be from the cash flow statement, NOT net income
- CapEx is always negative in filings, so FCFE = OCF + CapEx (adding a negative)
- Net Borrowing = New debt issued - Debt repaid (can be 0 for simplicity)
- If FCFE is negative, consider using Revenue-based DCF or skip DCF

#### Step 2: Estimate Growth Rate
This is the most critical assumption. You MUST justify it.

Factors to consider:
- Historical revenue growth (last 3-5 years)
- Industry growth rate
- Company's competitive position
- TAM (Total Addressable Market) expansion
- Management guidance
- Analyst consensus (search web for this)
- Margin expansion/contraction potential

Guidelines:
- Mature companies (AAPL, JNJ): 5-12% growth
- Growth companies (NVDA, TSLA): 15-40% growth
- Hypergrowth (early stage): 40-80% (use with caution)
- ALWAYS use a fade rate: growth should decrease toward
  terminal rate over the projection period
- Terminal growth: 2-3% (never above long-term GDP growth)

When you choose a growth rate, EXPLAIN WHY:
"I'm using 25% growth for NVDA because:
 1. AI GPU market growing 35% CAGR (web search: GPU market forecast)
 2. NVDA has 80%+ market share (search: NVDA GPU market share)
 3. Data center revenue grew 122% last year (from 10-K)
 4. Fading to 3% terminal over 10 years (mean reversion)"

#### Step 3: Calculate WACC (Weighted Average Cost of Capital)
WACC = E/(E+D) * Re + D/(E+D) * Rd * (1-Tax)

Where:
- E = Market cap (equity value)
- D = Total debt
- Re = Cost of equity = Risk-free rate + Beta * Equity Risk Premium
  - Risk-free rate: 10-year Treasury yield (~4.0-4.5%)
  - Beta: From Yahoo Finance or calculate from price history
  - Equity Risk Premium: 5-6% (standard)
- Rd = Cost of debt = Interest Expense / Total Debt
- Tax = Effective tax rate from financials

Simplified approach (when data is limited):
- Low risk (mega-cap, stable): WACC = 8-9%
- Medium risk (large-cap, growth): WACC = 9-11%
- High risk (small-cap, volatile): WACC = 11-14%

#### Step 4: Project Cash Flows (10 years)
```python
# Example code the agent would write:

projected_fcfe = []
current_fcfe = base_fcfe

for year in range(1, 11):
    # Fade growth rate toward terminal rate
    fade_factor = (10 - year) / 10
    year_growth = terminal_growth + (initial_growth - terminal_growth) * fade_factor
    
    current_fcfe = current_fcfe * (1 + year_growth)
    projected_fcfe.append(current_fcfe)
```

#### Step 5: Calculate Terminal Value
Terminal Value = Final Year FCFE * (1 + terminal_growth) / (WACC - terminal_growth)

IMPORTANT: Terminal value often represents 60-80% of total value.
If it's >85%, the model is too sensitive to terminal assumptions.
Flag this to the user.

#### Step 6: Discount to Present Value
PV = Sum of [FCFE_t / (1 + WACC)^t] + Terminal_Value / (1 + WACC)^10

#### Step 7: Calculate Per-Share Value
Intrinsic Value = (PV of Cash Flows + Cash - Debt) / Shares Outstanding

Note: Adjust for net cash/debt position!
- If company has more cash than debt → adds to value
- If company has more debt than cash → subtracts from value

#### Step 8: Margin of Safety
Margin of Safety = (Intrinsic Value - Current Price) / Intrinsic Value * 100

Interpretation:
- > 30% MoS: Strong buy signal
- 15-30% MoS: Potentially undervalued
- 0-15% MoS: Fairly valued
- < 0% MoS: Potentially overvalued

#### Step 9: Scenario Analysis
ALWAYS run three scenarios:
- Conservative: Lower growth, higher WACC
- Base: Your best estimate
- Optimistic: Higher growth, lower WACC

Present as a range, not a single number.

### PE Analysis - Quick Valuation Check

1. Get current PE from web
2. Get sector average PE
3. Get historical PE (5-year average)
4. Get forward PE (analyst estimates)
5. Fair Value = EPS * Fair PE Multiple

Where Fair PE = weighted average of:
- Historical avg (40% weight)
- Sector avg (30% weight)  
- Growth-adjusted PEG of 1 (30% weight)

### Moat Analysis Framework

Search web and X for evidence of:
1. Network Effects (more users = more value)
2. Switching Costs (hard to leave)
3. Cost Advantages (economies of scale)
4. Intangible Assets (brand, patents, licenses)
5. Efficient Scale (natural monopoly)

Rate moat: None / Narrow / Wide
Justify with specific evidence.

## Output Format

When presenting analysis, structure it as:

### [TICKER] - [Company Name]

**Verdict**: [UNDERVALUED / FAIRLY VALUED / OVERVALUED]

**Current Price**: $X.XX
**Fair Value Range**: $X.XX - $X.XX (conservative to optimistic)
**Upside/Downside**: X% to X%

**Key Thesis**:
[2-3 sentences on why this stock is valued this way]

**DCF Analysis**:
[Show assumptions with justification]
[Show calculation summary]

**Risks**:
[Top 3 risks to the thesis]

**Sources**:
[List all web/filing sources used]

## Important Rules

1. ALWAYS cite your sources (URLs from web search)
2. ALWAYS show your math (use code execution)
3. ALWAYS present a range, not a single number
4. ALWAYS explain WHY you chose each assumption
5. NEVER give buy/sell recommendations (legal reasons)
   Say "appears undervalued" not "buy this stock"
6. ALWAYS include risks and what could go wrong
7. If data is unreliable or missing, SAY SO
8. If a company is too complex to value (banks, REITs),
   explain why and suggest alternative methods
"""
```

---

## The Agent Flow (Step by Step)

### Example: User asks "What do you think about NVDA?"

```
┌─────────────────────────────────────────────────────┐
│ Step 1: RESEARCH (web_search + x_search)            │
│                                                     │
│ Agent thinks: "I need financial data for NVDA"      │
│                                                     │
│ → web_search("NVDA Nvidia financials 2025")         │
│   Returns: Yahoo Finance page, MarketWatch, etc.    │
│                                                     │
│ → web_search("NVDA 10-K SEC filing cash flow")      │
│   Returns: SEC Edgar link, financial summary        │
│                                                     │
│ → x_search("NVDA stock sentiment analysis")         │
│   Returns: What traders/investors think on X        │
│                                                     │
│ Data gathered:                                      │
│   Price: $875                                       │
│   OCF: $28.7B                                       │
│   CapEx: $3.8B                                      │
│   Shares: 2.47B                                     │
│   Beta: 1.65                                        │
│   Revenue growth: 122%                              │
│   Market cap: $2.16T                                │
│   Total debt: $8.5B                                 │
│   Cash: $31.4B                                      │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ Step 2: REASON (LLM thinking)                       │
│                                                     │
│ Agent thinks:                                       │
│ "NVDA is a high-growth company driven by AI boom.   │
│  Revenue grew 122% but this is unsustainable.       │
│  I'll use 35% initial growth fading to 3%.          │
│  Higher WACC (10%) due to cyclical semiconductor    │
│  exposure and high beta of 1.65.                    │
│  FCFE = 28.7B - 3.8B = 24.9B                       │
│  Strong net cash position of $22.9B helps value."   │
│                                                     │
│ This reasoning comes from the SYSTEM PROMPT         │
│ knowledge, not from a tool!                         │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ Step 3: CALCULATE (code_execution)                  │
│                                                     │
│ Agent writes Python code:                           │
│                                                     │
│ ```python                                           │
│ import numpy as np                                  │
│                                                     │
│ # Inputs (from web research)                        │
│ base_fcfe = 24.9e9                                  │
│ initial_growth = 0.35                               │
│ terminal_growth = 0.03                              │
│ wacc = 0.10                                         │
│ years = 10                                          │
│ shares = 2.47e9                                     │
│ net_cash = 31.4e9 - 8.5e9  # Cash - Debt           │
│                                                     │
│ # Project cash flows with growth fade               │
│ projected = []                                      │
│ fcfe = base_fcfe                                    │
│ for year in range(1, years + 1):                    │
│     fade = (years - year) / years                   │
│     growth = terminal_growth + \                    │
│              (initial_growth - terminal_growth) \   │
│              * fade                                 │
│     fcfe = fcfe * (1 + growth)                      │
│     projected.append(fcfe)                          │
│                                                     │
│ # Discount to present value                         │
│ pv_cf = sum([cf / (1+wacc)**yr                      │
│              for yr, cf in                          │
│              enumerate(projected, 1)])              │
│                                                     │
│ # Terminal value                                    │
│ tv = projected[-1] * (1+terminal_growth) \          │
│      / (wacc - terminal_growth)                     │
│ pv_tv = tv / (1+wacc)**years                        │
│                                                     │
│ # Per-share intrinsic value                         │
│ intrinsic = (pv_cf + pv_tv + net_cash) / shares     │
│                                                     │
│ # Run 3 scenarios                                   │
│ # ... conservative, base, optimistic                │
│ ```                                                 │
│                                                     │
│ Grok executes this in sandbox → Returns results     │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ Step 4: SYNTHESIZE (LLM reasoning)                  │
│                                                     │
│ Agent combines:                                     │
│ - Quantitative: DCF results from code               │
│ - Qualitative: Web research on moat, risks          │
│ - Sentiment: X search on market opinion             │
│ - Judgment: From system prompt training              │
│                                                     │
│ Produces a complete analysis with citations.         │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ Step 5: PRESENT (Formatted output)                  │
│                                                     │
│ NVIDIA (NVDA) Analysis                              │
│                                                     │
│ Verdict: FAIRLY VALUED to SLIGHTLY OVERVALUED       │
│                                                     │
│ Current Price: $875                                 │
│ Fair Value Range: $720 - $1,150                     │
│ Base Case: $920 (5% upside)                         │
│                                                     │
│ DCF Assumptions:                                    │
│ • FCFE: $24.9B (from 10-K)                          │
│ • Growth: 35% → 3% fade over 10 years              │
│   Justification: AI GPU market growing 35% CAGR,   │
│   NVDA has 80%+ share, but growth will normalize    │
│ • WACC: 10% (beta 1.65, semiconductor cyclicality)  │
│ • Terminal growth: 3% (long-term GDP proxy)          │
│                                                     │
│ Key Risks:                                          │
│ 1. AMD/Intel catching up in AI chips                │
│ 2. Customer concentration (hyperscalers)             │
│ 3. Export restrictions to China                      │
│                                                     │
│ Sources: SEC 10-K, Yahoo Finance, Bloomberg          │
└─────────────────────────────────────────────────────┘
```

---

## Closed-Loop Agentic Behavior (Like Cursor)

The agent should iterate, not just do one pass:

```
User: "Find me undervalued semiconductor stocks"

Agent Loop:
  
  Iteration 1:
  → web_search("top semiconductor stocks 2026")
  → Gets list: NVDA, AMD, INTC, QCOM, AVGO, TXN, MU, ...
  → "I found 15 semiconductor stocks. Let me analyze each."

  Iteration 2:
  → For each stock, writes code to fetch key metrics
  → code_execution: fetch PE, market cap, growth from web data
  → Identifies 5 that look potentially undervalued (low PE + high growth)

  Iteration 3:
  → For the top 5, does deeper DCF analysis
  → web_search for each stock's cash flow data
  → code_execution: calculate DCF for each
  → 3 come out as undervalued

  Iteration 4:
  → x_search for sentiment on the 3 candidates
  → Checks if there's a reason they're cheap (red flags)
  → 2 pass the smell test

  Final Output:
  "I analyzed 15 semiconductor stocks. After DCF valuation
   and qualitative analysis, 2 appear undervalued:
   
   1. INTC - 38% upside (turnaround story, new fabs)
   2. MU - 24% upside (memory cycle recovery)
   
   Here's my full analysis..."
```

**This is exactly how Cursor works** - it reads, reasons, acts, checks, iterates.

---

## The Full Tech Stack (Simplified)

```
┌──────────────────────────────────────────────┐
│              FRONTEND                        │
│  Next.js 14 + Vercel AI SDK + Shadcn UI     │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │ Chat Interface (streaming)             │  │
│  │ Shows: text, code blocks, charts       │  │
│  │ Cites: sources from web search         │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │ Stock Pages (saved analyses)           │  │
│  │ Shows: DCF results, charts, metrics    │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
                    │ API calls
                    ↓
┌──────────────────────────────────────────────┐
│              BACKEND (FastAPI)                │
│  Thin layer - mostly proxies to Grok         │
│                                              │
│  /api/chat    → Streams Grok responses       │
│  /api/save    → Saves analysis to Supabase   │
│  /api/history → Gets chat history            │
└──────────────────────────────────────────────┘
                    │
          ┌─────────┴──────────┐
          ↓                    ↓
┌──────────────────┐  ┌───────────────────┐
│   GROK API       │  │   SUPABASE        │
│                  │  │                   │
│ Built-in tools:  │  │ Tables:           │
│ • web_search     │  │ • user_profiles   │
│ • x_search       │  │ • conversations   │
│ • code_execution │  │ • messages        │
│ • collections    │  │ • portfolios      │
│                  │  │ • saved_analyses  │
│ Custom tools:    │  │                   │
│ • save_analysis  │  │ Auth:             │
│ • get_portfolio  │  │ • Google OAuth    │
│ • search_saved   │  │ • Session mgmt   │
└──────────────────┘  └───────────────────┘
```

**Key insight**: The backend is THIN. Grok does the heavy lifting. Backend just handles auth, saves to Supabase, and streams responses.

---

## What Goes Where (Final Answer)

### System Prompt (Financial Knowledge)
```
✅ DCF methodology (step by step, with formulas)
✅ PE analysis framework
✅ Moat analysis framework (5 sources of moat)
✅ How to estimate growth rates (with guidelines)
✅ How to calculate WACC (with defaults)
✅ What FCFE is and how to calculate it
✅ How to read financial statements
✅ Where to find data (which sites to search)
✅ Output formatting rules
✅ Risk analysis framework
✅ Legal disclaimers (not financial advice)
✅ When to use which valuation method
```

### Grok Built-in Tools (Generic Capabilities)
```
✅ web_search → Fetch any financial data from the web
✅ x_search → Get market sentiment
✅ code_execution → Run Python for calculations
✅ collections_search → Search SEC filings (if uploaded)
```

### Custom Function Tools (User Data)
```
✅ save_analysis → Store result in Supabase
✅ get_portfolio → Read user's portfolio
✅ search_saved → Find past analyses
✅ get_user_preferences → Risk tolerance, etc.
```

### NOT in Tools (Agent Figures It Out)
```
❌ calculate_dcf (agent writes code instead)
❌ screen_stocks (agent searches web instead)
❌ compare_stocks (agent reasons instead)
❌ analyze_moat (agent searches and thinks instead)
```

**The agent is GENERALIZED, not specialized.** It can handle any financial question by combining knowledge with generic tools. Just like Cursor can handle any coding task.

---

## Is This Reasonable? Yes. Here's Why.

### 1. Grok 4 is smart enough
- Reasoning model (chain of thought)
- Can write correct Python code
- Can interpret financial data
- Has financial knowledge in training data

### 2. Built-in tools are production-ready
- web_search: Real-time, reliable
- code_execution: Sandboxed Python
- x_search: Unique sentiment data
- No need to build/maintain these yourself

### 3. System prompt gives domain expertise
- Like a CFA textbook in the prompt
- Ensures consistent methodology
- Agent follows it like Cursor follows its rules

### 4. Code execution ensures accuracy
- Agent doesn't "guess" DCF values
- It writes Python code and runs it
- Mathematical precision guaranteed
- User can see the code (transparency)

### 5. Web search replaces APIs
- No yfinance dependency
- No paid API needed (initially)
- Multiple sources for verification
- Always fresh data

### 6. This IS the Perplexity/Cursor model
- Perplexity: Knowledge + web_search
- Cursor: Knowledge + file tools
- TradvisorAI: Knowledge + web_search + code_execution

---

## Cost Analysis

### Grok API Pricing (grok-4-1-fast-reasoning):
```
Input tokens:  ~$0.50 per 1M tokens (estimated)
Output tokens: ~$2.00 per 1M tokens (estimated)

Per analysis (~5000 input + 2000 output tokens):
  = ~$0.006 per analysis

Web search: Included in API call
Code execution: Included in API call
X search: Included in API call

1000 analyses/month = ~$6
10,000 analyses/month = ~$60
```

### Total Monthly Cost:
```
Grok API: $6-60 (depending on usage)
Supabase: $0 (free tier) or $25 (pro)
Vercel: $0 (hobby) or $20 (pro)

Total: $6-105/month
```

**Incredibly cheap for a full financial analysis platform!**

---

## Implementation Timeline (Revised)

### Week 1: Core Agent
```
Day 1-2: Set up xAI SDK, test basic Grok call
Day 3-4: Write system prompt (financial methodology)
Day 5-6: Test: "What about AAPL?" → Full DCF analysis
Day 7: Iterate on prompt quality
```

### Week 2: Backend
```
Day 8-9: FastAPI skeleton with Grok streaming
Day 10-11: Supabase setup (user tables only)
Day 12-13: Save/load analyses
Day 14: Auth setup
```

### Week 3-4: Frontend
```
Day 15-18: Next.js + Chat interface (Vercel AI SDK)
Day 19-22: Stock detail pages
Day 23-26: Streaming + code block display
Day 27-28: Polish
```

### Week 5-6: Features & Launch
```
Day 29-32: Portfolio tracking
Day 33-36: Saved analyses gallery
Day 37-40: Mobile responsive + dark mode
Day 41-42: Launch!
```

**6 weeks instead of 12!** Because we don't need to build:
- Data population scripts
- DCF calculator library
- Cron jobs
- yfinance integration
- Custom RAG pipeline
- Code execution sandbox

Grok handles ALL of that.

---

## Example: Full Grok API Call

```python
import os
import json
from xai_sdk import Client
from xai_sdk.chat import user, tool, tool_result
from xai_sdk.tools import web_search, x_search, code_execution

client = Client(api_key=os.getenv("XAI_API_KEY"))

# System prompt with financial expertise
SYSTEM_PROMPT = """...(the full prompt from above)..."""

# Custom tools (for user data)
custom_tools = [
    tool(
        name="save_analysis",
        description="Save a completed stock analysis to the user's account",
        parameters={
            "type": "object",
            "properties": {
                "ticker": {"type": "string"},
                "analysis": {"type": "string"},
                "verdict": {"type": "string"},
                "fair_value_low": {"type": "number"},
                "fair_value_high": {"type": "number"},
            },
            "required": ["ticker", "analysis", "verdict"]
        },
    ),
    tool(
        name="get_portfolio",
        description="Get the user's portfolio holdings",
        parameters={
            "type": "object",
            "properties": {
                "user_id": {"type": "string"}
            },
            "required": ["user_id"]
        },
    ),
]

# Create chat with ALL tools
chat = client.chat.create(
    model="grok-4-1-fast-reasoning",
    system=SYSTEM_PROMPT,
    tools=[
        web_search(),           # Built-in: searches web
        x_search(),             # Built-in: searches X
        code_execution(),       # Built-in: runs Python
        *custom_tools,          # Custom: user data
    ],
)

# User asks a question
chat.append(user("What do you think about NVDA?"))

# Stream the response
for response, chunk in chat.stream():
    # Handle custom tool calls (built-in ones auto-execute)
    for tc in chunk.tool_calls:
        if tc.function.name == "save_analysis":
            # Save to Supabase
            args = json.loads(tc.function.arguments)
            result = save_to_supabase(args)
            chat.append(tool_result(result))
        elif tc.function.name == "get_portfolio":
            # Read from Supabase
            args = json.loads(tc.function.arguments)
            result = get_from_supabase(args)
            chat.append(tool_result(result))
    
    # Stream text to user
    if chunk.content:
        print(chunk.content, end="", flush=True)
```

**That's the ENTIRE agent!** ~50 lines of code.

---

## Final Answer to Your Questions

### "Is it reasonable to just fetch from the web?"
**YES.** This is exactly how Perplexity works. Grok's web_search is built for this.

### "Should DCF be in the system prompt or a tool?"
**System prompt for methodology. Code execution for calculations.** The agent writes custom analysis code for each stock, just like Cursor writes custom code for each task.

### "How do we make it like Cursor (agentic, closed-loop)?"
**Grok already supports multi-turn with tool use.** The agent can search → reason → calculate → search more → refine → present. The loop is built into the API.

### "Is it reasonable to put all DCF details in the prompt?"
**YES.** Cursor's system prompt is ~15,000 tokens of detailed instructions. Your financial methodology prompt will be similar. This is standard practice for specialized agents.

### "Should it be generalized for different financial tasks?"
**YES.** Don't build separate tools for DCF, PE, moat analysis, etc. Give the agent the KNOWLEDGE and let it use GENERIC tools (web_search, code_execution) to handle any financial question. Just like Cursor can handle any coding task with generic file tools.
