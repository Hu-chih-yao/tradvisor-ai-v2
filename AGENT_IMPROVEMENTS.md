# TradvisorAI Agent Improvements
Based on analysis of Claude Code's system prompt and tools.

## High Priority Fixes

### 1. Add `activeForm` to update_plan
**Current**: Steps only have `description`
**Better**: Add present continuous form for in-progress display

```json
{
  "description": "Search for NVDA financials",
  "activeForm": "Searching for NVDA financials",  // NEW
  "status": "in_progress"
}
```

### 2. Enforce ONE in_progress step
**Current**: Sometimes all steps marked completed at once
**Better**: Strict rule - only ONE step can be `in_progress` at a time

System prompt addition:
```
CRITICAL: Only mark ONE step as "in_progress" at a time.
After completing a step, mark it "completed" and move to next step.
NEVER batch completions - update after EACH step finishes.
```

### 3. Make final output concise by default
**Current**: Long DCF tables, detailed explanations (500+ words)
**Better**: Concise verdict by default, expand on request

Default output:
```markdown
**NVDA — Nvidia** | UNDERVALUED

| Price | Fair Value | Upside | MoS |
|-------|------------|--------|-----|
| $850  | $1,200     | +41%   | 29% |

**Thesis**: AI chip demand growing 40%+ YoY, strong moat in GPU design,
high FCF margin (35%). Risk: China export restrictions.

**Sources**: Yahoo Finance (price), 10-K Q4'25 (FCF), Gartner (growth)
```

Add to system prompt:
```
OUTPUT FORMAT:
- Default: Concise (< 150 words) verdict with key metrics table
- If user asks "explain" or "details": Provide full DCF breakdown
- ALWAYS cite sources with timestamps
```

### 4. Add source citations
**Current**: No attribution for data points
**Better**: Include source + timestamp for every number

```
NVDA P/E: 45.2 (Yahoo Finance, Feb 15 2026, 2:30pm)
FCF: $12.5B (SEC EDGAR 10-K, filed Jan 28 2026)
```

### 5. Allow batching independent searches
**Current**: "Update after EVERY tool call" blocks parallelism
**Better**: Allow batching searches that don't depend on each other

```
CRITICAL PROGRESS UPDATE RULES:
- ALWAYS call update_plan AFTER completing a logical step
- You MAY batch multiple independent web searches (e.g., searching
  for 3 different stocks' P/E ratios), then update_plan once with results
- You MUST update_plan after each code_execution
- Maximum 3-4 tools before requiring update_plan
```

## Medium Priority

### 6. Task breakdown threshold
**Current**: Always create detailed 12+ step plans
**Better**: Adaptive complexity

```
TASK BREAKDOWN RULES:
- Simple queries (1 stock, basic metrics): 3-5 steps
- Complex queries (screening, multi-stock): 10-15 steps
- Trivial queries ("What's AAPL P/E?"): Skip plan, just search and answer
```

### 7. Professional objectivity reminder
Add to system prompt:
```
OBJECTIVITY:
- Prioritize factual accuracy over confirming user's investment thesis
- If data contradicts user's beliefs, present it objectively
- Investigate uncertainty rather than making assumptions
- Never say "buy/sell" - say "appears undervalued/overvalued"
```

## Low Priority

### 8. Verbose mode flag
Allow user to control output detail:
```python
run_agent("Analyze NVDA", verbose=True)  # Full DCF breakdown
run_agent("Analyze NVDA")  # Concise summary (default)
```

### 9. Streaming plan updates
Instead of re-rendering full plan, stream deltas:
```
✓ Step 1: Search financials (5.2s)
> Step 2: Calculate DCF... (in progress)
```

## Implementation Priority

**Week 1** (Critical for Cursor-like UX):
1. Add activeForm to tools.py update_plan schema
2. Enforce ONE in_progress rule in system prompt
3. Make default output concise (< 150 words)

**Week 2** (Polish):
4. Add source citations to output format
5. Allow batching 3-4 independent searches
6. Adaptive task breakdown (skip plan for trivial queries)

**Week 3** (Nice-to-have):
7. Verbose mode flag
8. Professional objectivity examples in prompt
9. Streaming plan deltas in UI
