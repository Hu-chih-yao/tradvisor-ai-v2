# TradvisorAI Product Strategy Discussion

**Last Updated**: Feb 11, 2025

---

## 1. Where You Are Now

Based on your codebase:

- **Agent**: Senior equity research analyst — DCF, PE, moat analysis, screening
- **Tools**: `web_search`, `code_interpreter`, `update_plan` (agentic loop)
- **Architecture**: Python agent + Supabase Edge Functions (TypeScript/Grok)
- **Positioning**: "Like Cursor for finance" — autonomous stock research

---

## 2. The Core Question: How to Position for a Subscription Model?

You're weighing three directions:

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **A. Stock for Cursor** | Narrow: equity research only | Clear focus, strong DCF/valuation depth | Smaller TAM, overlaps with finviz/barrons |
| **B. Finance for Cursor** | Broader: stocks + crypto + funds + personal finance | Bigger TAM, more use cases | Harder to be best-in-class everywhere |
| **C. Personal Financial Consultant** | Human-like advisor: planning, budgeting, goals, taxes | High perceived value, sticky | Regulation (advisor vs data), liability |

---

## 3. Recommendation: Start Vertically, Expand Later

### Phase 1: "Stock Research for Cursor" (Months 1–6)

**Why start narrow:**

1. **Differentiation** — You already have strong DCF methodology, planning, and agentic loop. Most tools are dashboards, not agents.
2. **Cursor analogy** — Cursor is “AI for code”; you’re “AI for stock research.” Same mental model.
3. **TAM** — Retail investors + hobbyists + small fund analysts = millions of users.
4. **Execution** — One use case, one prompt, one tool set. Easier to ship and iterate.

**Target persona:**  
"Individual investor who wants to research stocks like a pro but doesn’t have time to read 10-Ks."

---

### Phase 2: "Finance for Cursor" (Months 6–12)

**Once stock research is solid:**

- Add ETFs, mutual funds, crypto basic analysis  
- Same agent, broader prompts and tools  
- Keep equity as the flagship, others as extensions  

---

### Phase 3: "Personal Financial Consultant" (Year 2+)

**When you have traction and resources:**

- Income, expenses, goals, tax optimization  
- Requires compliance, disclaimers, possibly licensing  
- Better as a separate product or add-on tier  

---

## 4. What You Should Have (Checklist)

### Must-Have (MVP for Subscription)

| Item | Status | Notes |
|------|--------|-------|
| **Agentic loop** | ✅ Done | Plan → Execute → Update → Done |
| **Web search** | ✅ Done | Grok built-in |
| **Code execution** | ✅ Done | DCF calculations |
| **DCF methodology** | ✅ Done | Prompts + templates |
| **Chat UI** | 🔄 Partial | Need polished UX |
| **Subscription / auth** | ❓ | Stripe + Supabase? |
| **Usage limits** | ❓ | Per tier (e.g. 10 analyses/month free) |
| **Data persistence** | ❓ | Save analyses, watchlists |

### Nice-to-Have (Differentiation)

| Item | Why |
|------|-----|
| **Cursor/IDE integration** | Use case: devs researching stocks while coding |
| **API for power users** | Integrations (Notion, Discord, etc.) |
| **Portfolio context** | Agent knows holdings; suggestions consider diversification |
| **Comparative analysis** | "Compare AAPL vs MSFT vs GOOGL" in one run |
| **Export** | PDF, Notion, or markdown reports |

### Not Needed Early

- Cryptocurrency (different audience, different workflows)
- Real-time trading execution (complex, regulated)
- Tax optimization (wait until consultant phase)

---

## 5. Cursor Analogy: What Makes It Sticky?

| Cursor | TradvisorAI (Stock) |
|--------|---------------------|
| Codebase context | Portfolio + watchlist context |
| Refactor, explain, debug | DCF, screen, compare |
| In IDE | Web app (maybe Cursor extension later) |
| Pro = more requests | Pro = more analyses, faster, priority |

---

## 6. Monetization Sketch

| Tier | Price | Limits | Value |
|------|-------|--------|-------|
| **Free** | $0 | 3–5 analyses/month, basic DCF | Acquisition |
| **Pro** | $19–29/mo | Unlimited, full methodology, export | Power users |
| **Team** | $49+/user | Shared watchlists, team reports | Small funds, research groups |

---

## 7. Competitive Snapshot

| Competitor | Focus | Weakness |
|------------|--------|----------|
| Koyfin | Dashboards | No agent, no real research |
| Kavout | AI signals | Black box, no explainability |
| AlphaSense | Enterprise | Too expensive for individuals |
| ChatGPT | General | Not finance-specialized, no agentic loop |

**Your edge:**  
Agentic + explainable + methodology-based (DCF) + “Cursor-like” workflow.

---

## 8. Next Steps (Action Items)

1. [ ] **Ship MVP** — Chat + agent + basic subscription gate
2. [ ] **User interviews** — 10–20 users: “How do you research stocks today?”
3. [ ] **Single landing page** — “Stock research, automated” or “AI analyst in your pocket”
4. [ ] **Pricing test** — Free vs $19 vs $29, measure conversion

---

## 9. Summary

| Question | Answer |
|----------|--------|
| **Stock vs Finance vs Consultant?** | Start with **Stock** (Cursor for equities). |
| **What to have?** | Agentic loop ✅, DCF ✅, chat ✅, subscription, usage limits, persistence. |
| **How to sell?** | “Your AI equity analyst” — research stocks like a pro in minutes. |
| **Expansion?** | Add broader finance later; consultant phase when you have traction and compliance. |

---

*Document for internal discussion. Update as you validate assumptions.*
