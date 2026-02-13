-- TradvisorAI V2 Database Schema
-- Supabase (PostgreSQL)
-- Created: February 2, 2026

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- STOCK DATA TABLES
-- ============================================================================

-- 1. Companies (S&P 500 stocks)
CREATE TABLE companies (
    ticker VARCHAR(10) PRIMARY KEY,
    name TEXT NOT NULL,
    sector VARCHAR(100),
    industry VARCHAR(100),
    description TEXT,
    
    -- Company details
    employees INTEGER,
    founded INTEGER,
    country VARCHAR(2) DEFAULT 'US',
    
    -- Market data
    market_cap BIGINT,
    shares_outstanding BIGINT,
    exchange VARCHAR(10),
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Links
    logo_url TEXT,
    website TEXT,
    
    -- Metadata
    data_verified BOOLEAN DEFAULT false,
    data_source VARCHAR(50) DEFAULT 'yfinance',
    last_updated TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_companies_sector ON companies(sector);
CREATE INDEX idx_companies_market_cap ON companies(market_cap DESC);

-- 2. Prices (current and historical)
CREATE TABLE prices (
    id SERIAL PRIMARY KEY,
    ticker VARCHAR(10) REFERENCES companies(ticker) ON DELETE CASCADE,
    date DATE NOT NULL,
    
    -- OHLCV
    open DECIMAL(12,4),
    high DECIMAL(12,4),
    low DECIMAL(12,4),
    close DECIMAL(12,4),
    volume BIGINT,
    
    -- Calculated
    change_amount DECIMAL(12,4),
    change_percent DECIMAL(5,2),
    
    -- For current price queries
    is_latest BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(ticker, date)
);

-- Indexes for fast queries
CREATE INDEX idx_prices_ticker_date ON prices(ticker, date DESC);
CREATE INDEX idx_prices_latest ON prices(ticker) WHERE is_latest = true;

-- 3. Financials (quarterly and annual)
CREATE TABLE financials (
    id SERIAL PRIMARY KEY,
    ticker VARCHAR(10) REFERENCES companies(ticker) ON DELETE CASCADE,
    period_end DATE NOT NULL,
    period_type VARCHAR(10) NOT NULL, -- 'Q1', 'Q2', 'Q3', 'Q4', 'FY'
    fiscal_year INTEGER NOT NULL,
    
    -- Income Statement
    revenue BIGINT,
    cost_of_revenue BIGINT,
    gross_profit BIGINT,
    operating_expenses BIGINT,
    operating_income BIGINT,
    interest_expense BIGINT,
    tax_expense BIGINT,
    net_income BIGINT,
    
    -- Per Share
    eps DECIMAL(10,4),
    eps_diluted DECIMAL(10,4),
    shares_basic BIGINT,
    shares_diluted BIGINT,
    
    -- Other
    ebitda BIGINT,
    ebit BIGINT,
    
    -- Balance Sheet
    total_assets BIGINT,
    current_assets BIGINT,
    cash BIGINT,
    accounts_receivable BIGINT,
    inventory BIGINT,
    
    total_liabilities BIGINT,
    current_liabilities BIGINT,
    total_debt BIGINT,
    long_term_debt BIGINT,
    short_term_debt BIGINT,
    
    shareholders_equity BIGINT,
    retained_earnings BIGINT,
    
    -- Cash Flow Statement
    operating_cash_flow BIGINT,
    investing_cash_flow BIGINT,
    financing_cash_flow BIGINT,
    capex BIGINT,
    free_cash_flow BIGINT,
    
    -- Dividends
    dividends_paid BIGINT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(ticker, period_end, period_type)
);

-- Indexes
CREATE INDEX idx_financials_ticker ON financials(ticker, period_end DESC);

-- 4. DCF Valuations (pre-calculated)
CREATE TABLE dcf_valuations (
    id SERIAL PRIMARY KEY,
    ticker VARCHAR(10) REFERENCES companies(ticker) ON DELETE CASCADE,
    valuation_date DATE NOT NULL,
    
    -- Assumptions
    base_fcfe BIGINT,
    growth_rate DECIMAL(5,2),
    wacc DECIMAL(5,2),
    terminal_growth DECIMAL(5,2),
    projection_years INTEGER DEFAULT 10,
    
    -- Results
    intrinsic_value DECIMAL(12,2),
    current_price DECIMAL(12,2),
    margin_of_safety DECIMAL(5,2),
    upside_downside DECIMAL(5,2),
    
    -- Detailed breakdown
    pv_projected_fcfe BIGINT,
    pv_terminal_value BIGINT,
    enterprise_value BIGINT,
    net_debt BIGINT,
    equity_value BIGINT,
    
    -- Scenarios (JSONB for flexibility)
    scenarios JSONB, -- {conservative: {...}, base: {...}, optimistic: {...}}
    
    -- AI Explanation
    ai_growth_explanation TEXT,
    ai_confidence DECIMAL(3,2),
    
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(ticker, valuation_date)
);

-- Indexes for screening
CREATE INDEX idx_dcf_margin ON dcf_valuations(margin_of_safety DESC);
CREATE INDEX idx_dcf_upside ON dcf_valuations(upside_downside DESC);

-- 5. PE Analysis (pre-calculated)
CREATE TABLE pe_analysis (
    id SERIAL PRIMARY KEY,
    ticker VARCHAR(10) REFERENCES companies(ticker) ON DELETE CASCADE,
    analysis_date DATE NOT NULL,
    
    -- PE Ratios
    current_pe DECIMAL(8,2),
    forward_pe DECIMAL(8,2),
    trailing_pe DECIMAL(8,2),
    
    -- Comparisons
    sector_avg_pe DECIMAL(8,2),
    industry_avg_pe DECIMAL(8,2),
    historical_avg_pe DECIMAL(8,2),
    historical_min_pe DECIMAL(8,2),
    historical_max_pe DECIMAL(8,2),
    
    -- Growth
    peg_ratio DECIMAL(8,2),
    earnings_growth DECIMAL(5,2),
    
    -- Valuation
    fair_value_current_pe DECIMAL(12,2),
    fair_value_forward_pe DECIMAL(12,2),
    fair_value_sector_pe DECIMAL(12,2),
    
    -- Recommendation
    recommendation VARCHAR(20), -- 'STRONG_BUY', 'BUY', 'HOLD', 'SELL', 'STRONG_SELL'
    
    -- Peer comparison (JSONB)
    peers JSONB, -- [{ticker, pe, comparison}, ...]
    
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(ticker, analysis_date)
);

-- 6. Calculated Metrics (for fast screening)
CREATE TABLE metrics (
    ticker VARCHAR(10) REFERENCES companies(ticker) ON DELETE CASCADE,
    metric_date DATE NOT NULL,
    
    -- Profitability
    roe DECIMAL(8,2),
    roa DECIMAL(8,2),
    roic DECIMAL(8,2),
    gross_margin DECIMAL(5,2),
    operating_margin DECIMAL(5,2),
    net_margin DECIMAL(5,2),
    
    -- Efficiency
    asset_turnover DECIMAL(5,2),
    inventory_turnover DECIMAL(5,2),
    receivables_turnover DECIMAL(5,2),
    
    -- Leverage
    debt_to_equity DECIMAL(8,2),
    debt_to_assets DECIMAL(5,2),
    interest_coverage DECIMAL(8,2),
    current_ratio DECIMAL(5,2),
    quick_ratio DECIMAL(5,2),
    
    -- Valuation
    pe_ratio DECIMAL(8,2),
    pb_ratio DECIMAL(8,2),
    ps_ratio DECIMAL(8,2),
    pcf_ratio DECIMAL(8,2),
    ev_to_ebitda DECIMAL(8,2),
    ev_to_sales DECIMAL(8,2),
    
    -- Growth (YoY %)
    revenue_growth DECIMAL(5,2),
    earnings_growth DECIMAL(5,2),
    fcf_growth DECIMAL(5,2),
    book_value_growth DECIMAL(5,2),
    
    -- Dividends
    dividend_yield DECIMAL(5,2),
    payout_ratio DECIMAL(5,2),
    
    PRIMARY KEY (ticker, metric_date)
);

-- Indexes for screening
CREATE INDEX idx_metrics_pe ON metrics(pe_ratio);
CREATE INDEX idx_metrics_roic ON metrics(roic DESC);
CREATE INDEX idx_metrics_revenue_growth ON metrics(revenue_growth DESC);
CREATE INDEX idx_metrics_roe ON metrics(roe DESC);

-- 7. AI Insights (moat, risks, etc.)
CREATE TABLE ai_insights (
    id SERIAL PRIMARY KEY,
    ticker VARCHAR(10) REFERENCES companies(ticker) ON DELETE CASCADE,
    insight_type VARCHAR(50) NOT NULL, -- 'moat', 'risks', 'growth', 'business_model', 'competitive_analysis'
    insight_date DATE NOT NULL,
    
    -- Content
    title TEXT,
    content TEXT NOT NULL,
    summary TEXT,
    
    -- Structured data (JSONB)
    data JSONB, -- Flexible structure for different insight types
    
    -- Metadata
    confidence DECIMAL(3,2), -- 0-1 score
    sources JSONB, -- [{source: 'earnings_call', date: '2024-01-15'}, ...]
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ai_insights_ticker_type ON ai_insights(ticker, insight_type, insight_date DESC);

-- ============================================================================
-- USER TABLES
-- ============================================================================

-- 8. User Profiles (extends Supabase auth.users)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    
    -- Subscription
    subscription_tier VARCHAR(20) DEFAULT 'free', -- 'free', 'pro', 'elite'
    subscription_status VARCHAR(20) DEFAULT 'active', -- 'active', 'canceled', 'expired', 'trialing'
    subscription_start_date TIMESTAMP,
    subscription_end_date TIMESTAMP,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    
    -- Usage tracking
    analyses_this_month INTEGER DEFAULT 0,
    analyses_limit INTEGER DEFAULT 10, -- Based on tier
    last_analysis_at TIMESTAMP,
    
    -- Preferences
    preferences JSONB DEFAULT '{}',
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 9. Conversations (AI chat history)
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    title TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL, -- 'user', 'assistant', 'system'
    content TEXT NOT NULL,
    
    -- Tool calls and results (JSONB)
    tool_calls JSONB,
    tool_results JSONB,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);

-- 10. Portfolios (user watchlists & holdings)
CREATE TABLE portfolios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    name TEXT DEFAULT 'My Portfolio',
    description TEXT,
    
    -- Settings
    is_default BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE portfolio_holdings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,
    ticker VARCHAR(10) REFERENCES companies(ticker) ON DELETE CASCADE,
    
    -- Position details
    shares DECIMAL(15,4),
    avg_cost DECIMAL(12,2),
    purchase_date DATE,
    
    -- Notes
    notes TEXT,
    tags TEXT[],
    
    added_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(portfolio_id, ticker)
);

-- Indexes
CREATE INDEX idx_portfolio_holdings_portfolio ON portfolio_holdings(portfolio_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on user tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_holdings ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only access their own data

-- User Profiles
CREATE POLICY "Users can view own profile" 
    ON user_profiles FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
    ON user_profiles FOR UPDATE 
    USING (auth.uid() = id);

-- Conversations
CREATE POLICY "Users can view own conversations" 
    ON conversations FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversations" 
    ON conversations FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations" 
    ON conversations FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations" 
    ON conversations FOR DELETE 
    USING (auth.uid() = user_id);

-- Messages
CREATE POLICY "Users can view messages in own conversations" 
    ON messages FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM conversations 
            WHERE conversations.id = messages.conversation_id 
            AND conversations.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert messages in own conversations" 
    ON messages FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM conversations 
            WHERE conversations.id = messages.conversation_id 
            AND conversations.user_id = auth.uid()
        )
    );

-- Portfolios
CREATE POLICY "Users can view own portfolios" 
    ON portfolios FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own portfolios" 
    ON portfolios FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own portfolios" 
    ON portfolios FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own portfolios" 
    ON portfolios FOR DELETE 
    USING (auth.uid() = user_id);

-- Portfolio Holdings
CREATE POLICY "Users can view own portfolio holdings" 
    ON portfolio_holdings FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM portfolios 
            WHERE portfolios.id = portfolio_holdings.portfolio_id 
            AND portfolios.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage own portfolio holdings" 
    ON portfolio_holdings FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM portfolios 
            WHERE portfolios.id = portfolio_holdings.portfolio_id 
            AND portfolios.user_id = auth.uid()
        )
    );

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolios_updated_at BEFORE UPDATE ON portfolios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolio_holdings_updated_at BEFORE UPDATE ON portfolio_holdings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS (for common queries)
-- ============================================================================

-- Latest stock data view
CREATE VIEW v_latest_stocks AS
SELECT 
    c.ticker,
    c.name,
    c.sector,
    c.industry,
    c.market_cap,
    p.close as current_price,
    p.change_percent as price_change_percent,
    d.intrinsic_value as dcf_value,
    d.upside_downside as dcf_upside,
    d.margin_of_safety,
    pe.current_pe,
    pe.recommendation,
    m.roe,
    m.roic,
    m.revenue_growth
FROM companies c
LEFT JOIN prices p ON c.ticker = p.ticker AND p.is_latest = true
LEFT JOIN LATERAL (
    SELECT * FROM dcf_valuations 
    WHERE ticker = c.ticker 
    ORDER BY valuation_date DESC 
    LIMIT 1
) d ON true
LEFT JOIN LATERAL (
    SELECT * FROM pe_analysis 
    WHERE ticker = c.ticker 
    ORDER BY analysis_date DESC 
    LIMIT 1
) pe ON true
LEFT JOIN LATERAL (
    SELECT * FROM metrics 
    WHERE ticker = c.ticker 
    ORDER BY metric_date DESC 
    LIMIT 1
) m ON true;

-- ============================================================================
-- SAMPLE DATA (for testing)
-- ============================================================================

-- Insert a few sample companies for testing
INSERT INTO companies (ticker, name, sector, industry, market_cap, data_verified) VALUES
('AAPL', 'Apple Inc.', 'Technology', 'Consumer Electronics', 3000000000000, true),
('MSFT', 'Microsoft Corporation', 'Technology', 'Software', 2800000000000, true),
('GOOGL', 'Alphabet Inc.', 'Technology', 'Internet Content & Information', 1800000000000, true)
ON CONFLICT (ticker) DO NOTHING;

-- Note: Full data population done by bootstrap script

COMMENT ON TABLE companies IS 'S&P 500 company information';
COMMENT ON TABLE prices IS 'Daily price data (OHLCV)';
COMMENT ON TABLE financials IS 'Quarterly and annual financial statements';
COMMENT ON TABLE dcf_valuations IS 'Pre-calculated DCF valuations';
COMMENT ON TABLE pe_analysis IS 'Pre-calculated P/E analysis';
COMMENT ON TABLE metrics IS 'Calculated financial metrics for screening';
COMMENT ON TABLE ai_insights IS 'AI-generated insights (moat, risks, etc.)';
COMMENT ON TABLE user_profiles IS 'User account information';
COMMENT ON TABLE conversations IS 'AI chat conversations';
COMMENT ON TABLE messages IS 'Chat messages';
COMMENT ON TABLE portfolios IS 'User portfolios/watchlists';
COMMENT ON TABLE portfolio_holdings IS 'Stocks in user portfolios';
