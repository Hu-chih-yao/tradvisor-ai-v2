# Agent Architecture Discussion: Single Agent vs Multi-Agent System

**Date**: February 13, 2026  
**Status**: DISCUSSION / PLANNING  
**Decision**: Pending

---

## The Problem

Our current agent is a **value investing specialist** — it does DCF, PE analysis, and moat evaluation really well. But that only appeals to ~20-30% of investors. To capture the majority of users, we need to support multiple investing styles:

| Investing Style | Current Support | % of Retail Investors |
|---|---|---|
| Value Investing (DCF, PE, margin of safety) | ✅ Full | ~20% |
| Technical Analysis (charts, indicators, patterns) | ❌ None | ~40% |
| Growth Investing (revenue accel, TAM, Rule of 40) | ⚠️ Partial | ~25% |
| Income/Dividend Investing | ❌ None | ~15% |
| Macro/Sector Rotation | ❌ None | ~10% |
| Quantitative/Factor Models | ❌ None | ~5% |
| Sentiment Analysis (news, social, insider) | ❌ None | ~15% |
| Options & Derivatives | ❌ None | ~10% |
| Risk/Portfolio Analysis | ❌ None | ~20% |

> Note: percentages overlap — most investors use 2-3 styles.

---

## Three Architecture Options

### Option A: One Mega-Agent (Everything in One Prompt)

```
User Query → [Single Agent with MASSIVE system prompt] → Analysis
                    (DCF + TA + Growth + Dividend + Macro + ...)
```

**How it works**: Stuff all financial methodologies into one giant system prompt. The agent decides which to use based on the query.

**Pros**:
- Simplest architecture (no coordination needed)
- Can naturally cross-reference between analysis types
- Single conversation context, easy state management

**Cons**:
- ❌ System prompt is already 151 lines — adding 6+ more analysis types = 500-800 lines
- ❌ Model quality degrades with massive prompts (attention dilution)
- ❌ Higher token costs (huge prompt on every API call)
- ❌ Hard to maintain — changing DCF methodology means touching a file used by everything
- ❌ User gets everything even when they only need technical analysis
- ❌ Can't specialize model choice per analysis type (TA might benefit from vision models)

**Verdict**: Works for 2-3 analysis types. Does NOT scale to 6+.

---

### Option B: Lead Analyst + Specialist Sub-Agents (Recommended)

```
User Query → [Lead Analyst / Orchestrator]
                ├── Value Analyst (DCF, PE, Moat)          ← current agent
                ├── Technical Analyst (charts, indicators)  ← new
                ├── Growth Analyst (TAM, Rule of 40)        ← new
                ├── Income Analyst (dividends, yield)       ← new
                ├── Macro Analyst (rates, sector rotation)  ← new
                ├── Risk Analyst (portfolio, correlation)   ← new
                └── Sentiment Analyst (news, insider)       ← new
                        ↓
              [Lead Analyst synthesizes findings]
                        ↓
                  Final Report to User
```

**How it works**: Like a real investment firm. The Lead Analyst understands the user's question, decides which specialists to consult, runs them (potentially in parallel), and synthesizes a unified report.

**Pros**:
- ✅ Each sub-agent has a focused, high-quality prompt (50-100 lines each, not 500+)
- ✅ Sub-agents can be developed, tested, and updated independently
- ✅ Can run multiple analysts in parallel (DCF + TA simultaneously)
- ✅ Different models per analyst (cheap model for simple TA, expensive for complex DCF)
- ✅ Natural UX: "Let me consult our technical analyst..." feels like a real firm
- ✅ Easy to add new analysts without touching existing ones
- ✅ Users can choose which analysts to include (personalization)
- ✅ Each analyst can have specialized tools (TA gets charting tools, quant gets backtesting)

**Cons**:
- More complex to build (orchestration logic)
- State sharing between sub-agents needs design
- Potentially higher latency if run sequentially (mitigated by parallel execution)
- Need to handle conflicting recommendations (Value says buy, TA says sell)

**Verdict**: Best balance of quality, scalability, and maintainability. This is how real investment firms work.

---

### Option C: User-Created Custom Models (Platform Approach)

```
User → [Model Builder UI]
            ├── Choose inputs (revenue, FCF, price, volume, ...)
            ├── Choose methodology (DCF template, custom formula, ...)
            ├── Set parameters (growth rate, discount rate, ...)
            └── Run & Share
                    ↓
         [Custom Model Marketplace]
```

**How it works**: Users build their own analysis models, share them, use others' models. Think "Notion templates for financial analysis."

**Pros**:
- Maximum flexibility — power users love this
- Community/social moat (shared models, leaderboards)
- Users feel ownership, higher engagement
- Infinite variety without us building everything

**Cons**:
- ❌ Extremely hard UX problem — most users don't know how to build models
- ❌ Quality control is a nightmare (garbage models giving bad advice)
- ❌ Liability risk (user creates bad model, loses money, blames us)
- ❌ Takes 3-6 months to build well
- ❌ Only appeals to advanced users (<10%)

**Verdict**: Great Phase 3 feature. NOT the right MVP approach.

---

## Recommended Architecture: Option B (Multi-Agent)

### The "Investment Firm" Architecture

Think of TradvisorAI as a virtual investment firm with specialized analysts:

```
┌─────────────────────────────────────────────────────┐
│                    USER QUERY                        │
│          "Should I buy NVDA right now?"              │
└─────────────────────┬───────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────┐
│              LEAD ANALYST (Orchestrator)             │
│                                                     │
│  1. Parse intent → "Buy decision for NVDA"          │
│  2. Select analysts → Value + Tech + Growth + Risk  │
│  3. Dispatch queries (parallel where possible)      │
│  4. Collect & synthesize findings                   │
│  5. Handle conflicts ("Value says buy, TA says      │
│     wait for pullback → recommend scaling in")      │
│  6. Present unified recommendation                  │
└──┬──────┬──────┬──────┬──────┬──────┬───────────────┘
   │      │      │      │      │      │
   ▼      ▼      ▼      ▼      ▼      ▼
┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐
│Value ││Tech  ││Growth││Income││Macro ││Risk  │
│      ││      ││      ││      ││      ││      │
│ DCF  ││ RSI  ││ TAM  ││ Div  ││Rates ││ VaR  │
│ PE   ││ MACD ││Rev $ ││Yield ││Sector││Beta  │
│ Moat ││Bands ││R40   ││DRIP  ││Cycle ││Corr  │
└──────┘└──────┘└──────┘└──────┘└──────┘└──────┘
```

### How the Orchestrator Routes Queries

| User Query | Analysts Called | Why |
|---|---|---|
| "Analyze NVDA" | Value + Growth + Tech | Full analysis needs all three |
| "Is NVDA oversold?" | Tech + Sentiment | Technical question |
| "Best dividend stocks" | Income + Value + Risk | Income-focused screen |
| "Compare AAPL vs MSFT" | Value + Growth (both) | Comparative needs fundamentals |
| "Portfolio risk check" | Risk + Macro | Portfolio-level analysis |
| "What's the market sentiment on AI?" | Sentiment + Macro + Growth | Thematic/sector question |
| "Fair value of TSLA?" | Value + Growth | Valuation question |
| "When should I sell AAPL?" | Tech + Risk + Sentiment | Timing question |

### Sub-Agent Specifications

#### 1. Value Analyst (Existing — refactor from current agent)
- **Methodology**: DCF, PE, PEG, Price-to-Book, EV/EBITDA, Margin of Safety
- **Tools**: web_search, code_interpreter
- **Data needed**: financials, cash_flow, balance_sheet
- **Output**: Intrinsic value range, verdict (undervalued/overvalued), confidence

#### 2. Technical Analyst (NEW — highest priority)
- **Methodology**: Moving averages (SMA/EMA 20/50/200), RSI, MACD, Bollinger Bands, support/resistance, volume analysis, chart patterns
- **Tools**: web_search, code_interpreter (for indicator calculations)
- **Data needed**: prices (OHLCV), volume
- **Output**: Trend direction, key levels, signal (bullish/bearish/neutral), entry/exit zones
- **DB additions**: `technical_signals` table

#### 3. Growth Analyst (NEW)
- **Methodology**: Revenue acceleration, TAM analysis, Rule of 40 (SaaS), net retention, market share trends
- **Tools**: web_search, code_interpreter
- **Data needed**: revenue history, industry data, competitor data
- **Output**: Growth trajectory, TAM penetration %, growth sustainability score

#### 4. Income/Dividend Analyst (NEW)
- **Methodology**: Dividend yield, growth rate, payout ratio, dividend safety score, DRIP modeling, Chowder rule
- **Tools**: web_search, code_interpreter
- **Data needed**: dividend history, earnings, payout ratio
- **Output**: Dividend safety score, yield-on-cost projections, DRIP value at 10/20/30 years
- **DB additions**: `dividend_analysis` table

#### 5. Macro Analyst (NEW)
- **Methodology**: Interest rate impact, sector rotation model, economic cycle positioning, inflation correlation
- **Tools**: web_search
- **Data needed**: Fed rates, CPI, PMI, sector ETF performance
- **Output**: Macro backdrop rating, sector recommendation, headwinds/tailwinds

#### 6. Risk Analyst (NEW)
- **Methodology**: Beta, VaR, max drawdown, Sharpe ratio, correlation matrix, stress testing
- **Tools**: code_interpreter
- **Data needed**: price history, portfolio holdings
- **Output**: Risk score, portfolio correlation, drawdown scenarios, position sizing recommendation
- **DB additions**: `risk_assessments` table

#### 7. Sentiment Analyst (NEW — lower priority)
- **Methodology**: News sentiment scoring, insider trading signals, institutional ownership changes, social media pulse
- **Tools**: web_search
- **Data needed**: news feed, SEC filings (insider trades), 13F filings
- **Output**: Sentiment score (-1 to +1), insider signal, smart money flow direction

---

## Implementation Plan

### Phase 1: Foundation (Week 1-2)
- [ ] Refactor current agent into orchestrator + value sub-agent
- [ ] Build orchestrator routing logic (query classification)
- [ ] Design sub-agent interface/protocol (input/output contract)
- [ ] Add `analysis_sessions` table to DB (tracks which analysts ran, results)
- [ ] Test with existing Value Analyst as only sub-agent

### Phase 2: Technical Analyst (Week 3-4)
- [ ] Build Technical Analyst sub-agent (prompt + tools)
- [ ] Add `technical_signals` table to database
- [ ] Integrate TA calculations (RSI, MACD, Bollinger, MAs)
- [ ] Test orchestrator with Value + Technical
- [ ] Handle conflicting signals in synthesis

### Phase 3: Growth + Risk Analysts (Week 5-6)
- [ ] Build Growth Analyst sub-agent
- [ ] Build Risk Analyst sub-agent
- [ ] Add portfolio-level analysis capability
- [ ] Full integration testing with 4 analysts

### Phase 4: Income + Macro + Sentiment (Week 7-8)
- [ ] Build remaining sub-agents
- [ ] User preferences: "I'm a value investor" → default analyst mix
- [ ] Performance optimization (parallel execution, caching)

### Phase 5: Custom Models (Future)
- [ ] Model builder UI (if demand exists)
- [ ] Community sharing / marketplace
- [ ] Backtesting framework

---

## Database Changes Needed

```sql
-- New table: Track multi-agent analysis sessions
CREATE TABLE analysis_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(id),
    ticker VARCHAR(10) REFERENCES companies(ticker),
    query TEXT NOT NULL,
    
    -- Routing
    analysts_used TEXT[], -- ['value', 'technical', 'growth']
    
    -- Results from each analyst (JSONB for flexibility)
    analyst_results JSONB, -- {value: {...}, technical: {...}, ...}
    
    -- Synthesized result
    synthesis TEXT,
    overall_verdict VARCHAR(30), -- 'BULLISH', 'BEARISH', 'NEUTRAL', 'MIXED'
    confidence DECIMAL(3,2),
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- New table: Technical analysis signals
CREATE TABLE technical_signals (
    id SERIAL PRIMARY KEY,
    ticker VARCHAR(10) REFERENCES companies(ticker) ON DELETE CASCADE,
    signal_date DATE NOT NULL,
    
    -- Trend
    trend VARCHAR(10), -- 'bullish', 'bearish', 'neutral'
    trend_strength DECIMAL(3,2), -- 0-1
    
    -- Moving Averages
    sma_20 DECIMAL(12,4),
    sma_50 DECIMAL(12,4),
    sma_200 DECIMAL(12,4),
    ema_12 DECIMAL(12,4),
    ema_26 DECIMAL(12,4),
    
    -- Indicators
    rsi_14 DECIMAL(5,2),
    macd DECIMAL(12,4),
    macd_signal DECIMAL(12,4),
    macd_histogram DECIMAL(12,4),
    bollinger_upper DECIMAL(12,4),
    bollinger_lower DECIMAL(12,4),
    
    -- Key Levels
    support_1 DECIMAL(12,4),
    support_2 DECIMAL(12,4),
    resistance_1 DECIMAL(12,4),
    resistance_2 DECIMAL(12,4),
    
    -- Volume
    avg_volume_20d BIGINT,
    volume_trend VARCHAR(20), -- 'increasing', 'decreasing', 'stable'
    
    -- Signals
    signals JSONB, -- [{signal: 'golden_cross', strength: 0.8}, ...]
    
    UNIQUE(ticker, signal_date)
);

-- New table: Dividend analysis
CREATE TABLE dividend_analysis (
    id SERIAL PRIMARY KEY,
    ticker VARCHAR(10) REFERENCES companies(ticker) ON DELETE CASCADE,
    analysis_date DATE NOT NULL,
    
    current_yield DECIMAL(5,2),
    dividend_growth_5y DECIMAL(5,2),
    payout_ratio DECIMAL(5,2),
    dividend_safety_score DECIMAL(3,2), -- 0-1
    years_of_growth INTEGER,
    chowder_number DECIMAL(5,2),
    
    -- DRIP projections (JSONB)
    drip_projections JSONB, -- {10yr: {shares, income, value}, 20yr: {...}}
    
    UNIQUE(ticker, analysis_date)
);
```

---

## Key Design Decisions to Make

### 1. How do sub-agents communicate?
**Option A**: Shared context (all agents see same data)  
**Option B**: Message passing (orchestrator passes relevant data to each)  
**Recommendation**: Option B — keeps agents focused, reduces token waste

### 2. Sequential or parallel execution?
**Recommendation**: Parallel where possible. Value + Technical + Growth can all run at the same time. Only Risk needs to wait if it depends on other results.

### 3. How to handle conflicting recommendations?
**Example**: Value says NVDA is undervalued (BUY), Technical says RSI is 78 (overbought, WAIT)

**Recommendation**: The orchestrator acknowledges the conflict and provides nuanced advice:
> "NVDA appears fundamentally undervalued with 30% upside, but technical indicators suggest it's overbought short-term. **Consider scaling in** — buy 1/3 now, wait for a pullback to the 50-day MA for the next 1/3."

This is actually a **feature** — it's what makes multi-analyst better than single-agent. Real firms do exactly this.

### 4. Can users choose which analysts to use?
**Recommendation**: Yes. Default to "auto" (orchestrator picks), but allow:
- "Analyze NVDA with technical analysis only"
- User profile preference: "I'm a value investor" → always include Value + Moat
- UI toggles per analysis type

### 5. How does this affect the database?
The current schema is already well-designed. We add 3 new tables (analysis_sessions, technical_signals, dividend_analysis) and the existing tables (dcf_valuations, pe_analysis, metrics, ai_insights) stay as-is.

---

## Cost Analysis

| Approach | API Cost per Analysis | Latency | Quality |
|---|---|---|---|
| Single mega-agent | $0.05-0.15 | 30-60s | Medium (prompt bloat) |
| Multi-agent (2 analysts) | $0.06-0.12 | 20-40s (parallel) | High |
| Multi-agent (4 analysts) | $0.10-0.25 | 25-50s (parallel) | Very High |
| Multi-agent (all 7) | $0.20-0.50 | 30-60s (parallel) | Highest |

> Using cheaper models for simpler analysts (e.g., grok-3-mini for TA indicator calculation) keeps costs down.

---

## TL;DR Recommendation

**Go with Option B: Lead Analyst + Specialist Sub-Agents.**

1. It scales without quality degradation
2. It mirrors how real investment firms work (natural UX)
3. Each analyst can be built, tested, and improved independently
4. Parallel execution keeps latency acceptable
5. Conflicting signals become a feature, not a bug
6. Opens the door for user customization (choose your analysts) and eventually Option C (custom models) as a premium feature

**Start by refactoring the current agent into orchestrator + value analyst, then add technical analyst as the first new specialist (highest user demand).**
