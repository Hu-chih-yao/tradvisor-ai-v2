# TradvisorAI V2 🚀

**AI-Powered Stock Research Platform**

Like Cursor for finance - an AI agent that autonomously researches stocks, finds opportunities, and explains valuations in natural language.

---

## 🎯 Quick Start

```bash
# 1. Set up database
cd database
# Follow instructions in README.md to set up Supabase

# 2. Populate data
cd ../backend
python scripts/bootstrap_db.py

# 3. Start backend
uvicorn main:app --reload --port 8000

# 4. Start frontend
cd ../frontend
npm install
npm run dev
```

Visit http://localhost:3000

---

## 📊 Project Status

**Current Phase**: Week 1 - Foundation & Database

See [PROJECT_PLAN.md](./PROJECT_PLAN.md) for full 90-day roadmap.

---

## 🏗️ Tech Stack

- **Frontend**: Next.js 14 + TypeScript + Tailwind + Shadcn UI
- **Backend**: FastAPI + Python
- **Database**: Supabase (PostgreSQL)
- **AI**: Google Gemini 2.0 Flash
- **Data**: yfinance (free) → Financial Modeling Prep (paid)

---

## 📂 Project Structure

```
tradvisor-ai-v2/
├── frontend/          # Next.js app
├── backend/           # FastAPI + AI agent
├── database/          # Supabase schema & seeds
├── scripts/           # Utility scripts
└── docs/              # Documentation
```

---

## 🗄️ Database Strategy

**YES, we pre-calculate data!**

- Update prices: Every 5 min (market hours)
- Update financials: Quarterly
- Recalculate DCF: Quarterly or on-demand
- Result: Instant search across 500 stocks!

---

## 🎯 Features

### Current (Week 1-2):
- [x] Project structure
- [ ] Database schema
- [ ] Data population (top 50 stocks)
- [ ] DCF calculation

### Coming Soon:
- [ ] AI chat interface
- [ ] Stock grid (beautiful cards)
- [ ] Interactive DCF calculator
- [ ] Real-time search
- [ ] Portfolio tracker

---

## 📖 Documentation

- [PROJECT_PLAN.md](./PROJECT_PLAN.md) - Complete 90-day plan
- [database/README.md](./database/README.md) - Database setup
- [backend/README.md](./backend/README.md) - Backend API docs
- [frontend/README.md](./frontend/README.md) - Frontend guide

---

## 🤝 Contributing

This is a focused MVP project. Contributions welcome after launch!

---

## 📝 License

Private project - All rights reserved

---

Built with ❤️ for investors who want better tools
