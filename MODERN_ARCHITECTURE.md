# Modern Agent Architecture: On-Demand Analysis
## Like Perplexity for Finance - No Pre-Calculated Database Needed!

**Date**: February 2, 2026
**Key Insight**: Pre-calculating everything is the OLD way. Modern AI agents fetch and analyze on-demand!

---

## 🎯 The Paradigm Shift

### OLD Way (What We Were Planning):
```
1. Pre-calculate DCF for 500 stocks → Store in database
2. User searches → Query database → Return pre-calculated results
3. Update database quarterly

Problems:
❌ Need to populate database first (takes hours)
❌ Data gets stale (quarterly updates)
❌ Limited to pre-calculated assumptions
❌ Can't analyze new stocks on the fly
❌ Complex infrastructure (database, cron jobs, etc.)
```

### NEW Way (Modern AI Agent - Like Perplexity):
```
1. User asks: "Find undervalued tech stocks"
2. Agent:
   ├─ Calls yfinance API for each stock (parallel)
   ├─ Calculates DCF in real-time (Python code execution)
   ├─ Analyzes results
   └─ Returns insights in 5-10 seconds
3. No database needed for valuations!

Benefits:
✅ No upfront data population (start immediately!)
✅ Always fresh data (fetched when needed)
✅ Any assumptions (agent calculates with any inputs)
✅ Can analyze ANY stock (not limited to S&P 500)
✅ Simple infrastructure (just API calls + agent)
```

---

## 🤖 How Perplexity Works (Applied to Finance)

### Perplexity's Model:
```
User: "What's the capital of France?"
Perplexity:
  1. Searches web in real-time
  2. Fetches relevant pages
  3. Analyzes content
  4. Synthesizes answer
  5. Cites sources
```

### Your Finance Agent (Same Pattern):
```
User: "Find undervalued tech stocks"
Agent:
  1. Gets list of tech stocks (yfinance or API)
  2. For each stock:
     ├─ Fetches financial data (yfinance)
     ├─ Executes DCF calculation code
     ├─ Evaluates valuation
  3. Filters undervalued ones
  4. Synthesizes insights
  5. Shows calculations
  
Time: 5-10 seconds for 20 stocks
```

---

## 🏗️ The New Architecture: Code-Executing Agent

### Core Concept: Agent Writes & Executes Financial Analysis Code

```python
class FinanceCodeAgent:
    """
    Agent that writes Python code to analyze stocks
    Like Cursor writes code to refactor
    But for financial analysis
    """
    
    def __init__(self):
        self.llm = Gemini2Flash()
        self.tools = [
            FetchDataTool(),      # Fetch from yfinance
            ExecuteCodeTool(),    # Run Python code safely
            QueryWebTool(),       # Get real-time info
        ]
    
    async def analyze(self, user_query: str):
        """
        1. Agent plans approach
        2. Writes Python code to do analysis
        3. Executes code
        4. Returns results
        """
        
        # Example: User asks "Find undervalued tech stocks"
        
        # Agent writes code:
        code = """
import yfinance as yf
import pandas as pd

# Get tech stock list
tech_stocks = ['AAPL', 'MSFT', 'GOOGL', 'META', 'NVDA', ...]

results = []
for ticker in tech_stocks:
    stock = yf.Ticker(ticker)
    info = stock.info
    
    # Calculate simple DCF
    fcfe = calculate_fcfe(stock)
    wacc = 0.085
    growth = 0.10
    
    pv = 0
    for year in range(1, 11):
        fcfe = fcfe * (1 + growth)
        pv += fcfe / (1 + wacc)**year
    
    intrinsic = pv / info['sharesOutstanding']
    current = info['currentPrice']
    upside = (intrinsic - current) / current * 100
    
    if upside > 15:  # Undervalued
        results.append({
            'ticker': ticker,
            'name': info['longName'],
            'current': current,
            'fair_value': intrinsic,
            'upside': upside
        })

# Return top 10
results.sort(key=lambda x: x['upside'], reverse=True)
results[:10]
"""
        
        # Agent executes code
        output = await execute_code_safely(code)
        
        # Agent explains results
        response = f"""
        Found {len(output)} undervalued tech stocks:
        
        {format_results(output)}
        
        These companies are trading below their DCF fair value.
        """
        
        return response
```

---

## 🎯 Real Example: How It Works

### User Query: "What do you think about NVDA?"

**Agent Process**:

```python
# Step 1: Agent writes code to fetch data
code = """
import yfinance as yf

stock = yf.Ticker('NVDA')
info = stock.info
financials = stock.financials
cashflow = stock.cashflow

# Get key metrics
price = info['currentPrice']
pe = info['trailingPE']
market_cap = info['marketCap']
sector = info['sector']

# Calculate FCFE
operating_cf = cashflow.loc['Operating Cash Flow'].iloc[0]
capex = cashflow.loc['Capital Expenditure'].iloc[0]
fcfe = operating_cf + capex  # capex is negative

# Calculate DCF
growth = 0.35  # 35% for NVDA (high growth)
wacc = 0.10
years = 10

projected_fcfe = fcfe
pv_total = 0

for year in range(1, years + 1):
    projected_fcfe = projected_fcfe * (1 + growth)
    pv = projected_fcfe / (1 + wacc)**year
    pv_total += pv

# Terminal value
terminal_growth = 0.025
terminal_fcfe = projected_fcfe * (1 + terminal_growth)
terminal_value = terminal_fcfe / (wacc - terminal_growth)
pv_terminal = terminal_value / (1 + wacc)**years

# Per share
shares = info['sharesOutstanding']
intrinsic_value = (pv_total + pv_terminal) / shares

upside = (intrinsic_value - price) / price * 100

result = {
    'ticker': 'NVDA',
    'name': info['longName'],
    'price': price,
    'fair_value': intrinsic_value,
    'upside': upside,
    'pe': pe,
    'growth_rate': growth,
    'wacc': wacc
}

result
"""

# Step 2: Execute code
output = execute_code(code)

# Step 3: Agent synthesizes response
response = f"""
NVIDIA (NVDA) Analysis:

Current Price: ${output['price']}
DCF Fair Value: ${output['fair_value']:.2f}
Upside/Downside: {output['upside']:.1f}%

Valuation: {"OVERVALUED" if output['upside'] < 0 else "UNDERVALUED"}

The analysis assumes:
• Growth Rate: {output['growth_rate']*100}% (reflecting AI boom)
• Discount Rate: {output['wacc']*100}%

At {output['pe']}x PE, NVDA is priced for strong growth.
"""

return response
```

**Result**: Complete analysis in 5-10 seconds, no database needed!

---

## 💡 Why This Is BETTER

### Advantages of On-Demand Code Execution:

1. **No Setup Time** ✅
   - Start analyzing immediately
   - No 8-hour database population
   - No maintenance

2. **Always Fresh** ✅
   - Fetches latest data when you ask
   - No stale quarterly updates
   - Real-time earnings impact

3. **Unlimited Flexibility** ✅
   - Agent can adjust any assumption
   - Try different growth rates instantly
   - Run any calculation logic

4. **Any Stock, Anytime** ✅
   - Not limited to S&P 500
   - Analyze IPO stocks
   - International stocks

5. **Simpler Infrastructure** ✅
   - No database for valuations
   - No cron jobs
   - Just API calls

### What You STILL Store in Database:

```sql
-- Only store USER data, not stock calculations
user_profiles        -- User accounts
conversations        -- Chat history  
messages             -- Chat messages
portfolios           -- User watchlists
portfolio_holdings   -- User stocks
saved_analyses       -- User's custom DCF models
```

**Stock data? Fetch on-demand from yfinance!**

---

## 🚀 The Modern Stack

```
┌─────────────────────────────────────────────────┐
│            USER INTERFACE                       │
│  Next.js Chat + Stock Pages                    │
└─────────────────────────────────────────────────┘
                     ⬇️
┌─────────────────────────────────────────────────┐
│         AI AGENT (Gemini 2.0)                   │
│  Code-Executing Agent                           │
│                                                  │
│  Tools:                                         │
│  ├─ fetch_stock_data(ticker)                   │
│  ├─ execute_python_code(code)                  │
│  ├─ search_stocks(criteria)                    │
│  └─ compare_stocks(tickers)                    │
└─────────────────────────────────────────────────┘
                     ⬇️
┌─────────────────────────────────────────────────┐
│         DATA SOURCES (On-Demand)                │
│  ├─ yfinance API (free)                        │
│  ├─ Financial Modeling Prep ($14/mo)           │
│  └─ SEC Edgar (free, official filings)         │
└─────────────────────────────────────────────────┘
                     ⬇️
┌─────────────────────────────────────────────────┐
│    CODE EXECUTION SANDBOX                       │
│  E2B.dev or Modal Labs                         │
│  Safely runs Python code                        │
│  Returns results                                │
└─────────────────────────────────────────────────┘
```

**No valuation database! Just user data + on-demand analysis!**

---

## 🎯 How Screening Works (On-Demand)

### User: "Find undervalued tech stocks"

**Agent writes and executes code**:

```python
# Agent-generated code (executed in sandbox)

import yfinance as yf
import concurrent.futures

tech_stocks = [
    'AAPL', 'MSFT', 'GOOGL', 'META', 'NVDA',
    'AMD', 'INTC', 'QCOM', 'AVGO', 'CSCO',
    # ... 50 tech stocks
]

def analyze_stock(ticker):
    try:
        stock = yf.Ticker(ticker)
        info = stock.info
        cashflow = stock.cashflow
        
        # Quick DCF
        operating_cf = cashflow.loc['Operating Cash Flow'].iloc[0]
        capex = cashflow.loc['Capital Expenditure'].iloc[0]
        fcfe = operating_cf + capex
        
        # Simple 10-year projection
        growth = 0.10  # 10% default
        wacc = 0.085
        
        pv = sum([
            (fcfe * (1 + growth)**year) / (1 + wacc)**year
            for year in range(1, 11)
        ])
        
        intrinsic = pv / info['sharesOutstanding']
        current = info['currentPrice']
        upside = (intrinsic - current) / current * 100
        
        return {
            'ticker': ticker,
            'name': info['longName'],
            'price': current,
            'fair_value': intrinsic,
            'upside': upside,
            'pe': info.get('trailingPE'),
            'roic': info.get('returnOnEquity', 0) * 100
        }
    except:
        return None

# Parallel execution (fast!)
with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
    results = list(executor.map(analyze_stock, tech_stocks))

# Filter undervalued (>15% upside)
undervalued = [r for r in results if r and r['upside'] > 15]

# Sort by upside
undervalued.sort(key=lambda x: x['upside'], reverse=True)

# Return top 10
undervalued[:10]
```

**Time**: 8-12 seconds for 50 stocks (parallel fetching)
**Result**: Fresh data, accurate calculations, no database!

---

## ✅ This IS the Current Standard!

### Examples of Companies Doing This:

1. **Perplexity**
   - Searches web on-demand
   - No pre-indexed database
   - Fresh results every time

2. **Cursor**
   - Analyzes code on-demand
   - No pre-indexing needed
   - Works on any codebase instantly

3. **ChatGPT with Code Interpreter**
   - Executes Python code on-demand
   - No pre-calculated results
   - Analyzes data files in real-time

4. **Replit Agent**
   - Writes code on-demand
   - Executes to build apps
   - No pre-built templates

**Your Agent**: Same pattern for finance!

---

## 🚀 Simplified Architecture

```
User: "Find undervalued tech stocks"
        ↓
AI Agent (Gemini 2.0)
        ↓
Writes Python code:
  - Fetch 50 tech stocks from yfinance
  - Calculate DCF for each
  - Filter undervalued
  - Return top 10
        ↓
Code Execution Sandbox (E2B / Modal Labs)
        ↓
Returns: [
  {ticker: 'INTC', upside: 38%},
  {ticker: 'QCOM', upside: 24%},
  ...
]
        ↓
AI Agent formats response:
"Found 12 undervalued tech stocks. Top 3:
1. INTC - 38% upside
2. QCOM - 24% upside
3. AMD - 18% upside"
```

**Total time**: 5-10 seconds
**Infrastructure**: Minimal (just API calls)
**Maintenance**: None!

---

## 💰 Cost Comparison

### Old Way (Pre-Calculated Database):
```
Setup:
- 8 hours to populate 500 stocks
- $25/mo Supabase
- $20/mo Railway (cron jobs)
- Maintenance time

Cost: $45/mo + setup time
```

### New Way (On-Demand Agent):
```
Setup:
- 0 hours (start immediately!)
- Code execution: E2B.dev ($20/mo for 100k executions)
- yfinance: Free
- No maintenance

Cost: $20/mo (or free tier!)
```

**Cheaper + Simpler + Better!** 🎉

---

## 🛠️ Implementation: Code-Executing Agent

### Tool 1: Execute Financial Analysis Code

```python
from e2b_code_interpreter import CodeInterpreter

class ExecuteCodeTool:
    """
    Safely execute Python code for financial analysis
    """
    
    name = "execute_python_code"
    description = """
    Execute Python code for financial analysis.
    Can import: yfinance, pandas, numpy
    Returns: Calculation results
    """
    
    async def execute(self, code: str):
        """
        Run code in secure sandbox
        """
        # E2B sandbox (or Modal Labs)
        sandbox = CodeInterpreter()
        
        # Pre-install packages
        sandbox.notebook.exec_cell("!pip install -q yfinance pandas numpy")
        
        # Execute user code
        execution = sandbox.notebook.exec_cell(code)
        
        return {
            "success": True,
            "output": execution.text,
            "results": execution.results,
            "error": execution.error if execution.error else None
        }
```

### Tool 2: Fetch Stock Data

```python
class FetchStockDataTool:
    """
    Fetch stock data from yfinance
    """
    
    name = "fetch_stock_data"
    description = """
    Fetch financial data for a stock ticker.
    Returns: price, financials, ratios, growth rates
    """
    
    async def execute(self, ticker: str):
        import yfinance as yf
        
        stock = yf.Ticker(ticker)
        info = stock.info
        
        return {
            "ticker": ticker,
            "name": info.get('longName'),
            "price": info.get('currentPrice'),
            "pe": info.get('trailingPE'),
            "market_cap": info.get('marketCap'),
            # ... more data
        }
```

### Agent Workflow:

```python
# User: "Find undervalued tech stocks"

# Agent decides approach:
plan = """
1. Get list of tech stocks
2. For each stock:
   - Fetch financial data
   - Calculate DCF
   - Check if undervalued
3. Return top 10
"""

# Agent writes code to execute plan:
code = """
import yfinance as yf

tech_stocks = ['AAPL', 'MSFT', ...]

undervalued = []
for ticker in tech_stocks:
    # Fetch and calculate
    ...
    if upside > 15:
        undervalued.append(...)

undervalued[:10]
"""

# Execute code
results = await agent.execute_code(code)

# Agent formats response
response = format_results(results)
```

**This is how modern AI agents work!**

---

## ✅ Benefits of This Approach

### 1. **Instant Start** ⚡
- No database setup
- No data population
- Just deploy agent → works immediately

### 2. **Always Fresh** 🔄
- Fetches data when user asks
- Real-time market prices
- Latest earnings reflected

### 3. **Infinite Flexibility** 🎯
- Can analyze any stock
- Any assumptions
- Any calculation method
- Agent writes custom code for each query

### 4. **Cost Effective** 💰
- Only fetch data when needed
- No storage costs for valuations
- Pay per execution (not per month)

### 5. **Scales Naturally** 📈
- More users = more API calls (handled by yfinance)
- No database scaling issues
- No infrastructure to maintain

---

## 🤔 But What About Speed?

### "Won't it be slow to fetch 50 stocks?"

**NO! Parallel execution is fast:**

```python
# Sequential (OLD):
for ticker in 50_stocks:
    fetch(ticker)  # 0.5s each
# Total: 25 seconds ❌

# Parallel (NEW):
with ThreadPoolExecutor(max_workers=10):
    results = executor.map(fetch, 50_stocks)
# Total: 3-5 seconds ✅
```

**Modern APIs handle concurrency well!**

---

## 🎯 When to Use Each Approach

### Use ON-DEMAND (Code-Executing Agent) for:
- ✅ Custom analyses (user's own assumptions)
- ✅ One-off queries ("What about AAPL?")
- ✅ Screening with custom criteria
- ✅ Flexible calculations
- ✅ Any stock, any time

### Use PRE-CALCULATED (Database) for:
- ✅ Homepage "trending stocks" widget
- ✅ Static rankings updated daily
- ✅ Historical data visualization
- ✅ Analytics dashboards

**For your use case**: 90% on-demand, 10% pre-calculated!

---

## 📊 Recommended Hybrid Approach

### Minimal Database (Just Essentials):

```sql
-- Only store:
1. user_profiles (auth, subscriptions)
2. conversations (chat history)
3. portfolios (user watchlists)
4. saved_analyses (user's custom DCF models)

-- DON'T store:
❌ DCF valuations (calculate on-demand)
❌ PE analysis (calculate on-demand)
❌ Financial metrics (fetch from yfinance)
```

### Optional: Cache Recent Queries

```python
# Simple in-memory cache (Redis)
cache = {}

def get_stock_analysis(ticker):
    # Check cache (5 min TTL)
    if ticker in cache and cache[ticker]['timestamp'] > (now - 300):
        return cache[ticker]['data']
    
    # Not in cache → Calculate
    data = agent.analyze(ticker)
    
    # Store in cache
    cache[ticker] = {
        'data': data,
        'timestamp': now
    }
    
    return data
```

**Result**: Fast for repeated queries, fresh for new ones!

---

## 🚀 The New Plan (MUCH SIMPLER)

### Week 1-2: Build Agent with Code Execution
- [ ] Set up Gemini with function calling
- [ ] Build `execute_code` tool (E2B sandbox)
- [ ] Build `fetch_data` tool (yfinance wrapper)
- [ ] Test: "What about AAPL?" → Works!

### Week 3-4: Build UI
- [ ] Chat interface (Vercel AI SDK)
- [ ] Stream agent responses
- [ ] Show code execution (transparency)
- [ ] Display results in beautiful cards

### Week 5-6: Add Features
- [ ] Portfolio tracker (store in Supabase)
- [ ] Save custom analyses
- [ ] Share results
- [ ] Authentication

### Week 7-8: Polish & Launch
- [ ] Make it beautiful
- [ ] Mobile responsive
- [ ] Beta test
- [ ] Launch! 🚀

**Total time: 8 weeks (not 12!)**
**Complexity: Much simpler!**

---

## ✅ YES, THIS IS REASONABLE!

You're absolutely right! This is the **modern standard**:

1. ✅ Perplexity: Fetch & analyze on-demand
2. ✅ Cursor: Analyze code on-demand
3. ✅ ChatGPT: Execute code on-demand
4. ✅ Your Agent: Calculate valuations on-demand

**Don't pre-calculate everything. Let the agent do the work when needed!**

---

## 🎯 Updated Recommendation

### Forget the Pre-Calculated Database!

**Instead**:
1. Build AI agent that can write Python code
2. Agent fetches data from yfinance when needed
3. Agent calculates DCF/PE/ratios in real-time
4. Agent returns results in 5-10 seconds

**Benefits**:
- ✅ Start building TODAY (no database setup)
- ✅ Simpler architecture
- ✅ More flexible
- ✅ Lower cost
- ✅ Always fresh data

**What to store**:
- User data (auth, conversations, portfolios)
- Optional: Cache recent queries (5 min TTL)

**That's it!**

---

## 📞 Want to Start This Way Instead?

I can help you build:
1. Code-executing agent (Gemini + E2B)
2. Fetch data from yfinance
3. Calculate DCF in real-time
4. Return results in seconds

**This is MUCH simpler and more modern!**

Should we pivot to this approach? 🚀
