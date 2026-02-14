# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TradvisorAI V2 is an AI-powered stock research platform - "Cursor for Finance". It uses an AI agent that autonomously researches stocks, performs valuations, and explains analysis in natural language.

The project consists of:
- **Agent**: xAI Grok-powered agentic loop with web search and code execution (primary component)
- **Frontend**: Next.js 14 with React 18, TypeScript, Tailwind CSS (in development)
- **Backend**: FastAPI service (planned - thin proxy layer to Grok)
- **Database**: Supabase for user data only (stock data fetched on-demand)

**Key Architectural Decision**: This follows the modern agent pattern (like Perplexity/Cursor) - data is fetched and analyzed on-demand rather than pre-calculated. The agent has financial methodology knowledge in its system prompt and uses generic tools (web search, code execution) to handle any financial query.

## Development Commands

### Agent Development (Primary Component)
```bash
cd agent

# Set up virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure API key
cp .env.example .env
# Edit .env and add your XAI_API_KEY

# Run demo
python demo.py

# Test specific query
python -c "from agent import run_agent; list(run_agent('Analyze NVDA'))"
```

### Frontend Development
```bash
cd frontend

npm install             # Install dependencies
npm run dev             # Start Next.js dev server on port 3000
npm run build           # Build for production
npm run lint            # Run ESLint
```

### Backend Development (Planned)
```bash
cd backend

# Local development
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Architecture

### Agent Architecture (Core Component)

The agent follows the **"Cursor for Finance"** pattern - it doesn't have specialized financial tools, but rather has deep financial knowledge in its system prompt and uses generic tools to implement analyses.

**Key Files**:
- `agent/agent.py` - Agentic loop using OpenAI Responses API with Grok
- `agent/prompts.py` - System prompt with complete financial methodology (DCF, PE, moat analysis)
- `agent/tools.py` - Tool definitions (OpenAI function-calling format)
- `agent/config.py` - API configuration
- `agent/demo.py` - Terminal UI for testing

**Agentic Loop Flow**:
```
User Query → Grok creates plan → update_plan (custom function)
           → web_search (Grok built-in, server-side)
           → code_interpreter (Grok built-in, server-side)
           → update_plan (progress updates)
           → Final analysis
```

**Built-in Tools (Server-Side on Grok)**:
- `web_search` - Searches web for financial data (Yahoo Finance, SEC, news)
- `code_interpreter` - Executes Python code for DCF calculations
- `x_search` - Market sentiment from X/Twitter (available in Grok)

**Custom Tools (Handled Locally)**:
- `update_plan` - Plan creation and progress updates (Cursor-style)

**Important Principle**: DCF methodology lives in the system prompt (`prompts.py`), NOT as a specialized tool. The agent writes custom Python code for each analysis using `code_interpreter`, adapting assumptions per company. This is exactly how Cursor works - knowledge + generic tools, not specialized function tools.

### Frontend Structure (In Development)

```
frontend/
├── app/                    # Next.js 14 app directory
│   └── (routes will go here)
├── components/             # React components
│   └── ui/                 # Shadcn UI components
├── lib/                    # Utilities
├── package.json            # Dependencies
├── next.config.ts          # Next.js config
└── tsconfig.json           # TypeScript config
```

**Stack**:
- Next.js 14 with App Router
- React 18
- TypeScript
- Tailwind CSS 4
- Shadcn UI components
- Supabase client (`@supabase/supabase-js`)
- React Markdown for rendering agent responses

### Backend Structure (Planned)

```
backend/
├── agent/              # Agent-related code (if needed)
├── calculators/        # Reusable calculation modules
├── data/               # Data fetching utilities
├── scripts/            # Utility scripts
├── requirements.txt    # Python dependencies
└── (main.py will go here)
```

**Purpose**: Thin proxy layer between frontend and Grok API
- Handle authentication
- Stream agent responses to frontend
- Save/load user data (conversations, portfolios) to Supabase
- Most heavy lifting done by Grok agent

### Database Strategy (Supabase)

**Critical Understanding**: We do NOT pre-calculate stock valuations. Data is fetched on-demand by the agent.

**What we store**:
- User data: `user_profiles`, `conversations`, `messages`
- User portfolios: `portfolios`, `portfolio_holdings`
- Saved analyses: `saved_analyses` (user's custom DCF results)

**What we DON'T store**:
- Stock prices (fetched via web search)
- Financial statements (fetched via web search)
- DCF valuations (calculated on-demand)
- PE ratios (calculated on-demand)

This is the modern agent pattern - like Perplexity searches the web on-demand, we fetch and analyze financial data on-demand.

## Key Technical Details

### Agent Models

Available xAI models (configure in `agent/.env`):

| Model | Cost | Best For |
|-------|------|----------|
| `grok-3-mini` | Cheapest | Development/testing |
| `grok-4-1-fast-reasoning` | ~$0.20/M in | Production (recommended) |
| `grok-4` | ~$3/M in | Complex multi-stock analysis |

Default: `grok-4-1-fast-reasoning`

### API Integration

**Agent → Grok**: Uses OpenAI SDK with xAI base URL
```python
client = OpenAI(
    api_key=XAI_API_KEY,
    base_url="https://api.x.ai/v1"
)
```

**Frontend ↔ Backend**: REST API with streaming responses (planned)
- Frontend uses Vercel AI SDK for streaming
- Backend proxies Grok responses

### System Prompt Structure

The system prompt in `agent/prompts.py` contains:
1. Complete DCF methodology (step-by-step with formulas)
2. PE analysis framework
3. Moat analysis framework
4. Growth rate estimation guidelines
5. WACC calculation methods
6. Output formatting rules
7. Risk analysis framework

This is ~5000+ tokens of financial expertise, similar to how Cursor has detailed coding knowledge in its prompt.

### Parallel Tool Calling

The agent can call multiple tools in parallel:
```python
# Agent can request 3 web searches simultaneously:
# - Search for NVDA financials
# - Search for GPU market growth
# - Search for competitor comparisons
# All execute in parallel, results combined
```

## Example Queries

The agent handles various financial queries:

- `"Analyze NVDA"` - Full DCF + PE + moat analysis
- `"Find undervalued tech stocks"` - Screens sector, runs DCF on candidates
- `"Compare AAPL vs MSFT"` - Side-by-side valuation
- `"What is TSLA's fair value?"` - Quick valuation with scenarios
- `"Is the AI chip market overvalued?"` - Sector analysis

## Important Design Patterns

### 1. Knowledge in Prompt, Not Tools
**DON'T** create specialized tools like `calculate_dcf(ticker, growth, wacc)`.
**DO** put DCF methodology in system prompt and let agent write custom code.

Why? Flexibility. The agent adapts assumptions per company (35% growth for NVDA, 8% for AAPL) rather than using fixed formulas.

### 2. On-Demand Data Fetching
**DON'T** pre-populate database with stock valuations.
**DO** let agent fetch and calculate when user asks.

Why? Always fresh data, handles any stock (not just S&P 500), simpler infrastructure.

### 3. Stateful Conversations
Uses `previous_response_id` in Responses API for multi-turn conversations with automatic caching.

### 4. Plan-Update Loop
Agent calls `update_plan` custom function to report progress (Cursor-style):
```
Step 1: Researching NVDA financials... ✓
Step 2: Calculating DCF valuation... ✓
Step 3: Running scenario analysis... ✓
Step 4: Analyzing competitive moat... (in progress)
```

## Documentation References

- [README.md](./README.md) - Quick start guide
- [PROJECT_PLAN.md](./PROJECT_PLAN.md) - Original 90-day roadmap (NOTE: architecture pivoted)
- [MODERN_ARCHITECTURE.md](./MODERN_ARCHITECTURE.md) - On-demand vs pre-calculated design
- [GROK_AGENT_ARCHITECTURE.md](./GROK_AGENT_ARCHITECTURE.md) - Detailed agent design (Cursor analogy)
- [WEB_FIRST_ARCHITECTURE.md](./WEB_FIRST_ARCHITECTURE.md) - Web-search-first approach
- [database/README.md](./database/README.md) - Database setup (user data only)
- [agent/README.md](./agent/README.md) - Agent POC documentation

## Configuration Files

- `agent/.env` - XAI API key and model selection
- `frontend/next.config.ts` - Next.js configuration
- `frontend/tsconfig.json` - TypeScript with path aliases (`@/*`)
- `backend/requirements.txt` - FastAPI, Supabase, Google Gemini

## Current Project Status

**Week 1-2** (Current): Agent POC completed
- ✅ Agentic loop with Grok Responses API
- ✅ Web search integration (server-side)
- ✅ Code execution for DCF calculations
- ✅ Plan-update system (Cursor-style progress)
- ✅ Terminal demo UI

**Week 3-4** (Next): Frontend development
- [ ] Next.js setup with chat interface
- [ ] Streaming responses with Vercel AI SDK
- [ ] Stock detail pages
- [ ] Authentication with Supabase

**Week 5-6**: Backend + features
- [ ] FastAPI proxy to Grok
- [ ] Save/load analyses
- [ ] Portfolio tracking
- [ ] Mobile responsive

## Important Notes

- **Architecture Pivot**: Original plan was to pre-calculate DCF for 500 stocks. We pivoted to on-demand analysis (modern agent pattern). See MODERN_ARCHITECTURE.md for rationale.

- **Grok vs Gemini**: Agent uses Grok (xAI) for built-in web search and code execution. Backend may use Gemini for other tasks. Both use OpenAI-compatible APIs.

- **No yfinance Dependency**: Agent uses web search instead of yfinance API. More reliable, always fresh, handles any stock.

- **Cost Efficiency**: ~$0.006 per analysis with grok-4-1-fast-reasoning. 1000 analyses/month = ~$6.

- **Testing**: Use `agent/demo.py` for terminal-based testing. Frontend integration will use same agent via API proxy.
