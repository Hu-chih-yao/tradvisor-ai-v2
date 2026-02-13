# Database Setup Guide

## 🎯 Overview

We use **Supabase** (PostgreSQL) for everything:
- Stock data storage
- User authentication
- Real-time updates
- File storage

**Why pre-calculate data?**
- ✅ Search 500 stocks in <200ms
- ✅ Show results instantly
- ✅ Better user experience
- ✅ Lower compute costs

---

## 🚀 Setup Steps

### 1. Create Supabase Project

```bash
# Go to https://supabase.com
# Click "New Project"
# Name: tradvisor-ai-v2
# Database Password: [save this!]
# Region: Choose closest to you
```

### 2. Get Connection String

```bash
# In Supabase Dashboard:
# Settings → Database → Connection string

# Copy "URI" format:
postgresql://postgres:[password]@[host]:5432/postgres

# Save to .env file in backend/
SUPABASE_URL=https://[project-id].supabase.co
SUPABASE_KEY=[anon-key]
SUPABASE_CONNECTION_STRING=postgresql://...
```

### 3. Run Schema

```bash
# In Supabase SQL Editor:
# 1. Copy contents of schema.sql
# 2. Paste and run

# Or use psql:
psql $SUPABASE_CONNECTION_STRING < schema.sql
```

### 4. Verify Tables Created

```sql
-- Run in SQL Editor:
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Should see:
-- companies
-- prices
-- financials
-- dcf_valuations
-- pe_analysis
-- metrics
-- ai_insights
-- user_profiles
-- conversations
-- messages
-- portfolios
-- portfolio_holdings
```

---

## 📊 Data Population

### Bootstrap (Top 50 Stocks)

```bash
cd ../backend
python scripts/bootstrap_db.py
```

This will:
1. Fetch top 50 stocks from yfinance
2. Get financial data
3. Calculate DCF valuations
4. Store in database
5. Takes ~10 minutes

### Full S&P 500

```bash
python scripts/populate_sp500.py
```

This will:
1. Fetch all ~500 S&P 500 stocks
2. Calculate all valuations
3. Takes ~8 hours (runs overnight)

### Update Prices (Scheduled)

```bash
# Set up cron job (every 5 minutes during market hours)
*/5 9-16 * * 1-5 cd /path/to/backend && python scripts/update_prices.py

# Or use Vercel Cron / Railway Cron
```

---

## 📋 Tables Overview

### Stock Data Tables

| Table | Purpose | Update Frequency |
|-------|---------|------------------|
| `companies` | Basic company info | Monthly |
| `prices` | OHLCV price data | 5 minutes (market hours) |
| `financials` | Financial statements | Quarterly (after earnings) |
| `dcf_valuations` | DCF models | Quarterly |
| `pe_analysis` | P/E analysis | Daily |
| `metrics` | Calculated ratios | Quarterly |
| `ai_insights` | AI-generated insights | Quarterly |

### User Tables

| Table | Purpose |
|-------|---------|
| `user_profiles` | User accounts |
| `conversations` | Chat history |
| `messages` | Chat messages |
| `portfolios` | User watchlists |
| `portfolio_holdings` | Stocks in portfolios |

---

## 🔍 Common Queries

### Get Latest Stock Data

```sql
SELECT * FROM v_latest_stocks 
WHERE ticker = 'AAPL';
```

### Screen Undervalued Stocks

```sql
SELECT 
    ticker,
    name,
    current_price,
    dcf_value,
    dcf_upside,
    current_pe,
    roic
FROM v_latest_stocks
WHERE dcf_upside > 15
    AND current_pe < 30
    AND roic > 15
ORDER BY dcf_upside DESC
LIMIT 20;
```

### Get Stock with Full Details

```sql
SELECT 
    c.*,
    p.*,
    d.*,
    pe.*,
    m.*
FROM companies c
LEFT JOIN prices p ON c.ticker = p.ticker AND p.is_latest = true
LEFT JOIN dcf_valuations d ON c.ticker = d.ticker 
    AND d.valuation_date = (
        SELECT MAX(valuation_date) 
        FROM dcf_valuations 
        WHERE ticker = c.ticker
    )
LEFT JOIN pe_analysis pe ON c.ticker = pe.ticker 
    AND pe.analysis_date = (
        SELECT MAX(analysis_date) 
        FROM pe_analysis 
        WHERE ticker = c.ticker
    )
LEFT JOIN metrics m ON c.ticker = m.ticker 
    AND m.metric_date = (
        SELECT MAX(metric_date) 
        FROM metrics 
        WHERE ticker = c.ticker
    )
WHERE c.ticker = 'AAPL';
```

---

## 🔐 Row Level Security (RLS)

**Important**: Public stock data is readable by everyone. User data is protected.

```sql
-- Public tables (anyone can read)
- companies
- prices
- financials
- dcf_valuations
- pe_analysis
- metrics
- ai_insights

-- Private tables (users can only see their own data)
- user_profiles
- conversations
- messages
- portfolios
- portfolio_holdings
```

RLS policies are already set up in schema.sql!

---

## 🔄 Data Freshness Strategy

### Real-Time (Every 5 min)
- Stock prices during market hours
- Updated via cron job

### Daily
- PE ratios
- Simple metrics
- Quick to calculate

### Quarterly
- Financial statements (after earnings)
- DCF valuations
- Complex metrics
- AI insights

### On-Demand
- Custom DCF (user adjusts assumptions)
- Scenario analysis
- Comparisons

---

## 📈 Database Size Estimates

```
500 stocks × data points:

companies:          500 rows       = 100 KB
prices:            500 × 250 days  = 125K rows = 25 MB
financials:        500 × 20 qtrs   = 10K rows  = 10 MB
dcf_valuations:    500             = 500 rows  = 500 KB
pe_analysis:       500             = 500 rows  = 200 KB
metrics:           500             = 500 rows  = 300 KB
ai_insights:       500 × 3 types   = 1.5K rows = 2 MB

Total stock data: ~40 MB

User data (10,000 users):
user_profiles:     10K rows       = 1 MB
conversations:     50K            = 5 MB
messages:          500K           = 100 MB
portfolios:        20K            = 2 MB
holdings:          100K           = 10 MB

Total user data: ~120 MB

Grand Total: ~160 MB (well under Supabase free tier 500MB)
```

---

## 🛠️ Maintenance

### Weekly
- Check data quality
- Verify all stocks have recent data
- Review failed updates

### Monthly
- Clean up old price data (keep 1 year)
- Archive old conversations
- Review database performance

### Quarterly
- Recalculate all DCF valuations
- Update AI insights
- Add new S&P 500 stocks (if any)

---

## 🔧 Troubleshooting

### "Connection refused"
```bash
# Check connection string is correct
echo $SUPABASE_CONNECTION_STRING

# Test connection
psql $SUPABASE_CONNECTION_STRING -c "SELECT 1;"
```

### "Table doesn't exist"
```bash
# Verify schema was run
psql $SUPABASE_CONNECTION_STRING -c "\dt"
```

### "Row level security policy violation"
```bash
# Check if you're authenticated
# Make sure to pass auth token in requests
```

### "Query too slow"
```sql
-- Check indexes exist
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public';

-- Add missing indexes if needed
CREATE INDEX idx_custom ON table_name(column);
```

---

## 📞 Support

- Supabase Docs: https://supabase.com/docs
- PostgreSQL Docs: https://www.postgresql.org/docs/

---

**Next Steps**:
1. ✅ Set up Supabase project
2. ✅ Run schema.sql
3. ⏳ Run bootstrap script
4. ⏳ Verify data populated
5. ⏳ Set up cron jobs

Ready to populate data! 🚀
