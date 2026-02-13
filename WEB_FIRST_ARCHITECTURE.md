# Web-First Architecture: True Research Agent
## Like Perplexity - Fetch Everything from the Web!

**Date**: February 2, 2026
**Key Insight**: Why use yfinance API when the agent can search the web like Perplexity?

---

## 🎯 The Real Perplexity Model

### How Perplexity Actually Works:

```
User: "What's the GDP of France?"

Perplexity:
  1. Searches web for "France GDP 2026"
  2. Finds: IMF website, World Bank, news articles
  3. Extracts data from multiple sources
  4. Cross-verifies numbers
  5. Synthesizes answer with citations
  
NO API needed! Just web search!
```

### Your Agent (Same Way):

```
User: "What about AAPL?"

Agent:
  1. Searches web for "Apple AAPL financials"
  2. Finds: Yahoo Finance page, SEC Edgar filing, news
  3. Extracts:
     - Price from Yahoo Finance
     - Cash flow from 10-K filing
     - Growth from analyst reports
  4. Calculates DCF with extracted data
  5. Returns analysis with citations
  
NO yfinance API! Just web search!
```

**This is MORE robust than yfinance!**

---

## 🌐 Web-First Data Sources

### 1. **Yahoo Finance Website** (Not API)
```
Search: "AAPL stock price"
→ Find: finance.yahoo.com/quote/AAPL
→ Extract:
  - Current price: $189.45
  - PE ratio: 29.4
  - Market cap: $2.91T
  - 52-week range
```

### 2. **SEC Edgar** (Official Filings)
```
Search: "Apple 10-K SEC filing"
→ Find: sec.gov/edgar/...
→ Extract from 10-K:
  - Operating Cash Flow: $122B
  - CapEx: $11B
  - Free Cash Flow: $111B
  - Revenue growth
```

### 3. **Finviz** (Screening Data)
```
Search: "AAPL finviz"
→ Find: finviz.com/quote.ashx?t=AAPL
→ Extract:
  - Fundamentals table
  - Sector comparison
  - Technical indicators
```

### 4. **News & Analysis**
```
Search: "AAPL recent news analysis"
→ Find: Bloomberg, CNBC, SeekingAlpha
→ Extract:
  - Sentiment
  - Recent developments
  - Analyst opinions
```

### 5. **Company Investor Relations**
```
Search: "Apple investor relations"
→ Find: investor.apple.com
→ Extract:
  - Earnings transcripts
  - Guidance
  - Management commentary
```

**Agent searches web like a human analyst!**

---

## 🤖 Agent Tools (Web-First)

### Tool 1: Web Search (Like Perplexity)

```python
class WebSearchTool:
    """
    Search the web for financial data
    Uses Tavily, Brave Search, or SerpAPI
    """
    
    name = "search_web"
    description = """
    Search the web for information about stocks.
    Returns: URLs, snippets, extracted data
    """
    
    async def execute(self, query: str):
        # Use Tavily API (designed for AI agents)
        from tavily import TavilyClient
        
        tavily = TavilyClient(api_key="...")
        
        results = tavily.search(
            query=query,
            search_depth="advanced",  # Deep search
            include_raw_content=True   # Get full page content
        )
        
        return {
            "results": results['results'],
            "answer": results.get('answer'),  # AI-generated summary
            "sources": [r['url'] for r in results['results']]
        }
```

### Tool 2: Extract Financial Data from Web Pages

```python
class ExtractFinancialsTool:
    """
    Extract financial data from web pages
    Uses LLM to parse unstructured HTML
    """
    
    name = "extract_financials"
    description = """
    Extract financial metrics from a webpage.
    Input: URL
    Output: Structured financial data
    """
    
    async def execute(self, url: str):
        # Fetch page content
        html = await fetch_page(url)
        
        # Use LLM to extract structured data
        prompt = f"""
        Extract financial data from this HTML:
        {html}
        
        Return JSON with:
        - price
        - pe_ratio
        - market_cap
        - revenue
        - free_cash_flow
        - growth_rate
        """
        
        data = await llm.extract(prompt)
        
        return data
```

### Tool 3: Parse SEC Filings

```python
class ParseSECFilingTool:
    """
    Parse SEC Edgar filings (10-K, 10-Q)
    """
    
    name = "parse_sec_filing"
    description = """
    Get data from official SEC filings.
    Most reliable source!
    """
    
    async def execute(self, ticker: str, form_type: str = "10-K"):
        # Search SEC Edgar
        search_url = f"https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK={ticker}&type={form_type}"
        
        # Get latest filing URL
        filing_url = await find_latest_filing(search_url)
        
        # Parse XBRL or HTML
        financials = await parse_filing(filing_url)
        
        return {
            "source": "SEC Edgar",
            "filing": form_type,
            "url": filing_url,
            "data": financials
        }
```

### Tool 4: Execute Python Code

```python
class ExecuteCodeTool:
    """
    Execute Python code for calculations
    """
    
    name = "execute_python"
    description = """
    Execute Python code to calculate valuations.
    """
    
    async def execute(self, code: str):
        # E2B sandbox
        sandbox = CodeInterpreter()
        result = sandbox.notebook.exec_cell(code)
        return result
```

---

## 🎯 Real Example: Web-First Analysis

### User: "What do you think about NVDA?"

**Agent Workflow**:

```python
# Step 1: Search web for NVDA data
search_results = await search_web("NVDA Nvidia stock price financials")

# Returns:
# - finance.yahoo.com/quote/NVDA (price, ratios)
# - sec.gov/... (10-K filing)
# - investor.nvidia.com (investor relations)

# Step 2: Extract price from Yahoo Finance
price_data = await extract_financials("finance.yahoo.com/quote/NVDA")
# {
#   "price": 875.32,
#   "pe": 65.4,
#   "market_cap": "2.16T"
# }

# Step 3: Get cash flow from SEC filing
filing_data = await parse_sec_filing("NVDA", "10-K")
# {
#   "operating_cash_flow": 28.7B,
#   "capex": 3.8B,
#   "free_cash_flow": 24.9B
# }

# Step 4: Calculate DCF with extracted data
code = f"""
fcfe = {filing_data['free_cash_flow']}
growth = 0.35  # NVDA high growth
wacc = 0.10
years = 10

pv_total = sum([
    (fcfe * (1 + growth)**year) / (1 + wacc)**year
    for year in range(1, years + 1)
])

# Terminal value
terminal_growth = 0.025
terminal_fcfe = fcfe * (1 + growth)**years * (1 + terminal_growth)
terminal_value = terminal_fcfe / (wacc - terminal_growth)
pv_terminal = terminal_value / (1 + wacc)**years

# Per share
shares = {price_data['market_cap']} / {price_data['price']}
intrinsic_value = (pv_total + pv_terminal) / shares

result = {{
    'intrinsic_value': intrinsic_value,
    'current_price': {price_data['price']},
    'upside': (intrinsic_value - {price_data['price']}) / {price_data['price']} * 100
}}
"""

dcf_result = await execute_python(code)

# Step 5: Search for recent news
news_results = await search_web("NVDA Nvidia recent news")

# Step 6: Synthesize response
response = f"""
NVIDIA (NVDA) Analysis

Sources:
• Yahoo Finance: ${dcf_result['current_price']} (current price)
• SEC 10-K Filing: ${filing_data['free_cash_flow']}B FCF
• Recent News: {news_results['answer']}

DCF Valuation:
• Fair Value: ${dcf_result['intrinsic_value']:.2f}
• Current Price: ${dcf_result['current_price']}
• Upside: {dcf_result['upside']:.1f}%

At {price_data['pe']}x PE, NVDA is priced for strong AI growth.

[Citations: Yahoo Finance, SEC Edgar, Bloomberg]
"""

return response
```

**Result**: Complete analysis from web sources, like Perplexity!

---

## 🌟 Advantages of Web-First Approach

### 1. **No API Dependency** ✅
- Don't rely on yfinance (can break)
- Don't need paid APIs initially
- More resilient (multiple sources)

### 2. **Official Data** ✅
- SEC filings = most reliable
- Directly from company IR sites
- Cross-verify from multiple sources

### 3. **Qualitative Data** ✅
- News sentiment
- Analyst opinions
- Management commentary
- Industry trends

### 4. **Like Perplexity** ✅
- Users understand this model
- Shows sources (transparency)
- Can fact-check easily
- Trustworthy

### 5. **Cost Effective** ✅
- Web search: $1/1000 searches (Tavily)
- SEC Edgar: Free
- No database costs
- Scale cheaply

---

## 🔄 Hybrid Approach: Web + APIs

### Best Practice: Use Both!

```python
class StockDataFetcher:
    """
    Fetch stock data using multiple sources
    Fallback chain for reliability
    """
    
    async def get_stock_data(self, ticker: str):
        # Strategy 1: Try yfinance first (fast)
        try:
            import yfinance as yf
            stock = yf.Ticker(ticker)
            data = stock.info
            if data:
                return {
                    "source": "yfinance",
                    "data": data
                }
        except:
            pass
        
        # Strategy 2: Search web (Yahoo Finance)
        try:
            search = await search_web(f"{ticker} stock price yahoo finance")
            url = search['results'][0]['url']
            data = await extract_financials(url)
            return {
                "source": "Yahoo Finance (web)",
                "data": data
            }
        except:
            pass
        
        # Strategy 3: SEC Edgar (most reliable)
        try:
            filing = await parse_sec_filing(ticker, "10-K")
            return {
                "source": "SEC Edgar",
                "data": filing
            }
        except:
            pass
        
        # Strategy 4: Financial Modeling Prep API
        try:
            fmp_data = await fetch_from_fmp(ticker)
            return {
                "source": "Financial Modeling Prep",
                "data": fmp_data
            }
        except:
            pass
        
        return {"error": "Could not fetch data from any source"}
```

**Resilient**: If one source fails, try next!

---

## 🛠️ Recommended Tech Stack

### Core Agent:
```yaml
LLM: Google Gemini 2.0 Flash
  - Function calling
  - Code execution
  - Multimodal (can read images/charts)

Tools:
  - Web Search: Tavily API ($1/1000 searches)
  - Browser: Playwright (scrape pages)
  - Code Execution: E2B.dev ($20/mo)
  - SEC Parser: Free (sec-edgar-downloader)
  - yfinance: Free (backup only)

Storage:
  - Supabase: User data only ($25/mo)
  - Redis: Cache recent searches ($0 - Upstash free tier)

Frontend:
  - Next.js 14 (App Router)
  - Vercel AI SDK (streaming)
  - Shadcn UI (beautiful components)
```

**Total cost**: ~$50/mo (vs $0 with free tiers!)

---

## 💰 Cost Breakdown

### Web-First Approach:

```
Tavily Web Search:
  - $1 per 1,000 searches
  - 10,000 searches/mo = $10

E2B Code Execution:
  - $20/mo (100k executions)
  - Or use Modal Labs ($10/mo)

Supabase (user data only):
  - Free tier: 500MB database
  - Paid: $25/mo (if needed)

Total: $30-55/mo
```

### API-First Approach (for comparison):

```
yfinance: Free (but unreliable)

Financial Modeling Prep:
  - $14/mo (300 requests/day)
  - Need for production

Alpha Vantage:
  - $49/mo (750 requests/day)

Total: $63/mo minimum
```

**Web-first is cheaper AND more reliable!**

---

## 🎯 Example Queries (Web-Powered)

### Query 1: "Find undervalued tech stocks"

**Agent workflow**:
```
1. Search web: "best tech stocks 2026"
   → Get list of top tech companies

2. For each stock:
   - Search: "{ticker} financials"
   - Extract price, PE, FCF from web
   - Calculate DCF
   - Determine if undervalued

3. Return top 10 with sources
```

### Query 2: "Compare AAPL vs MSFT"

**Agent workflow**:
```
1. Search: "AAPL vs MSFT comparison"
   → Get qualitative comparison from articles

2. Search: "AAPL financials" & "MSFT financials"
   → Extract metrics from web

3. Execute code to calculate:
   - Growth rates
   - Valuation multiples
   - DCF for both

4. Synthesize comparison
```

### Query 3: "What's NVDA's competitive moat?"

**Agent workflow**:
```
1. Search: "NVDA competitive advantage moat"
   → Get articles, analysis

2. Search: "NVDA vs AMD vs INTC GPU market share"
   → Get market position data

3. Parse SEC filing for:
   - R&D spending
   - Patent portfolio
   - Margins vs competitors

4. Synthesize moat analysis
```

**All from web search! No APIs needed!**

---

## 🚀 Implementation Plan (Web-First)

### Phase 1: Core Agent (Week 1-2)
```
✅ Set up Gemini 2.0 with function calling
✅ Add Tavily web search tool
✅ Add Python code execution (E2B)
✅ Test: "What about AAPL?" works!
```

### Phase 2: Data Extraction (Week 3)
```
✅ Build web scraper (Playwright)
✅ Parse Yahoo Finance pages
✅ Parse SEC Edgar filings
✅ Extract structured data with LLM
```

### Phase 3: Calculations (Week 4)
```
✅ DCF calculator (Python code)
✅ PE analysis
✅ Growth rate estimation
✅ Multi-scenario modeling
```

### Phase 4: UI (Week 5-6)
```
✅ Chat interface (Next.js + Vercel AI SDK)
✅ Show sources (like Perplexity)
✅ Display calculations
✅ Beautiful stock cards
```

### Phase 5: Polish (Week 7-8)
```
✅ Add portfolio tracking
✅ Save analyses
✅ Mobile responsive
✅ Authentication
✅ Launch! 🚀
```

**Total: 8 weeks, simple architecture!**

---

## 📊 Data Quality: Web vs APIs

### Web-First Advantages:

| Metric | Web | yfinance API | Paid API |
|--------|-----|--------------|----------|
| **Reliability** | ⭐⭐⭐⭐⭐ (multiple sources) | ⭐⭐⭐ (breaks often) | ⭐⭐⭐⭐⭐ |
| **Official Data** | ✅ (SEC Edgar) | ❌ (scraped) | ✅ |
| **Cost** | 💰 ($1/1000) | Free | 💰💰💰 ($49/mo) |
| **Flexibility** | ⭐⭐⭐⭐⭐ (any source) | ⭐⭐ (only Yahoo) | ⭐⭐⭐⭐ |
| **Transparency** | ✅ (show sources) | ❌ (black box) | ❌ (black box) |

**Web-first wins on reliability and transparency!**

---

## 🎯 Example: Web-First vs API-First

### User: "What about TSLA?"

**API-First (Old)**:
```python
import yfinance as yf

stock = yf.Ticker("TSLA")
data = stock.info  # Sometimes fails!

if data:
    # Calculate DCF
    ...
else:
    return "Error fetching data"
```

**Web-First (New)**:
```python
# Step 1: Search web
results = await search_web("TSLA Tesla financials")

# Step 2: Extract from multiple sources
yahoo = await extract_from(results[0]['url'])  # Yahoo Finance
sec = await parse_sec_filing("TSLA")           # SEC Edgar
news = await search_web("TSLA recent news")    # Latest news

# Step 3: Cross-verify data
if yahoo['price'] != sec['price']:
    # Use SEC (more reliable)
    price = sec['price']

# Step 4: Calculate DCF with verified data
dcf = await calculate_dcf(sec['cash_flow'], ...)

# Step 5: Return with sources
return {
    "analysis": dcf,
    "sources": [
        "SEC 10-K Filing",
        "Yahoo Finance", 
        "Bloomberg News"
    ]
}
```

**Web-first is more robust!**

---

## ✅ This IS How Modern Agents Work!

### Examples:

1. **Perplexity**
   - Searches web for every query
   - No pre-indexed database
   - Cites sources

2. **ChatGPT with Bing**
   - Searches web when needed
   - Extracts information
   - Synthesizes answer

3. **Cursor**
   - Reads your codebase files
   - Searches web for docs
   - No pre-indexing needed

4. **Your Agent** (Same!)
   - Searches web for stock data
   - Extracts financials
   - Calculates valuations

**This is the standard!**

---

## 🎯 Final Architecture

```
┌─────────────────────────────────────┐
│     USER CHAT INTERFACE             │
│  "Find undervalued tech stocks"    │
└─────────────────────────────────────┘
              ⬇️
┌─────────────────────────────────────┐
│    AI AGENT (Gemini 2.0)            │
│  Decides what to do                 │
└─────────────────────────────────────┘
              ⬇️
     ┌────────┴────────┐
     ⬇️                ⬇️
┌─────────────┐  ┌──────────────┐
│ WEB SEARCH  │  │ CODE EXEC    │
│ (Tavily)    │  │ (E2B)        │
└─────────────┘  └──────────────┘
     ⬇️
┌─────────────────────────────────────┐
│   WEB SOURCES                       │
│  ├─ Yahoo Finance (prices)          │
│  ├─ SEC Edgar (official filings)    │
│  ├─ Finviz (screening)              │
│  ├─ News sites (sentiment)          │
│  └─ Company IR (guidance)           │
└─────────────────────────────────────┘
     ⬇️
┌─────────────────────────────────────┐
│   EXTRACT & CALCULATE               │
│  1. Parse HTML/PDFs                 │
│  2. Execute Python code             │
│  3. Calculate DCF                   │
│  4. Generate insights               │
└─────────────────────────────────────┘
     ⬇️
┌─────────────────────────────────────┐
│   RETURN WITH CITATIONS             │
│  "AAPL is undervalued by 15%"      │
│  Sources: SEC 10-K, Yahoo Finance   │
└─────────────────────────────────────┘
```

**No yfinance dependency! Just web + code!**

---

## 💡 Bottom Line

### Your Question: "Can it just fetch from the web instead of yfinance?"

**Answer**: YES! And it's BETTER!

**Why**:
1. ✅ More reliable (multiple sources)
2. ✅ Official data (SEC filings)
3. ✅ Transparent (show sources)
4. ✅ Flexible (any data source)
5. ✅ Like Perplexity (users understand)

**Implementation**:
- Tavily API for web search
- LLM to extract from HTML
- SEC Edgar for official data
- Code execution for calculations

**Result**: True research agent, not just API wrapper!

---

## 🚀 Want to Build This Way?

I can help you build:
1. ✅ Web search tool (Tavily)
2. ✅ Data extraction from web pages
3. ✅ SEC filing parser
4. ✅ Code execution for DCF
5. ✅ Chat UI with citations

**This is simpler, cheaper, and more robust than yfinance!**

Should we build the web-first version? 🌐
