# TradvisorAI Agent — POC

**Cursor for Finance**: An AI agent that searches the web, writes code, and builds stock valuations autonomously.

## Quick Start

```bash
cd agent

# 1. Create virtual environment
python3 -m venv venv
source venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Set up your API key
cp .env.example .env
# Edit .env and add your XAI_API_KEY

# 4. Run the demo
python demo.py
```

## How It Works

```
You: "Analyze NVDA"

Agent:
  1. Creates execution plan (visible in real-time)
  2. Searches web for NVDA financials (DuckDuckGo)
  3. Extracts cash flow, growth, market data
  4. Writes Python code to calculate DCF
  5. Executes code locally, gets intrinsic value
  6. Runs 3 scenarios (conservative/base/optimistic)
  7. Presents full analysis with sources
```

## Architecture

```
demo.py          → Terminal UI (rich)
  ↓
agent.py         → Agentic loop (plan → execute → adapt → finish)
  ↓
tools.py         → Tool definitions (OpenAI format) + local handlers
  ↓
prompts.py       → Financial methodology (DCF, PE, moat)
config.py        → API key, model, settings
```

**OpenAI-compatible**: Uses standard function-calling format. Works with xAI Grok, OpenAI GPT-4, or any compatible API.

**Parallel tool calling**: Model can request multiple tools at once (e.g., 3 web searches in parallel).

## Models

| Model | Cost | Best For |
|-------|------|----------|
| `grok-3-mini` | Cheapest | Development/testing |
| `grok-4-1-fast-reasoning` | $0.20/M in | Production (smart + cheap) |
| `grok-4` | $3/M in | Complex multi-stock analysis |

Change model in `.env`:
```
MODEL=grok-4-1-fast-reasoning
```

## Example Queries

- `"Analyze NVDA"` — Full DCF + PE + moat analysis
- `"Find undervalued tech stocks"` — Screens sector, runs DCF on candidates
- `"Compare AAPL vs MSFT"` — Side-by-side valuation
- `"What is TSLA's fair value?"` — Quick valuation
- `"Is the AI chip market overvalued?"` — Sector analysis
