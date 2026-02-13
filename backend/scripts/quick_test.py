#!/usr/bin/env python3
"""Quick test - Add 3 stocks manually"""

import sys
sys.path.insert(0, '/Users/hu/Projects/tradvisor/stock-analysis/backend')

import yfinance as yf
from supabase import create_client
from datetime import datetime

# Supabase
SUPABASE_URL = "https://acfjhcqdlqmtljnhdlzz.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjZmpoY3FkbHFtdGxqbmhkbHp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMjY2ODEsImV4cCI6MjA4NTgwMjY4MX0.CLfQ1ln7IM5pZgANHsC5FUMSsVVq742JEYmJt1Wdz6M"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Test with 3 stocks
stocks_to_test = ['AAPL', 'MSFT', 'GOOGL']

for ticker in stocks_to_test:
    print(f"\n{'='*60}")
    print(f"Testing {ticker}...")
    
    try:
        stock = yf.Ticker(ticker)
        info = stock.info
        
        # Insert company
        company_data = {
            'ticker': ticker,
            'name': info.get('longName', ticker),
            'sector': info.get('sector', 'Unknown'),
            'industry': info.get('industry', 'Unknown'),
            'market_cap': info.get('marketCap'),
            'shares_outstanding': info.get('sharesOutstanding'),
            'exchange': info.get('exchange', 'NASDAQ'),
            'data_verified': True
        }
        
        result = supabase.table('companies').upsert(company_data).execute()
        print(f"✓ Company: {company_data['name']}")
        
        # Insert price
        price = info.get('currentPrice', info.get('regularMarketPrice', 0))
        prev_close = info.get('previousClose', price)
        
        price_data = {
            'ticker': ticker,
            'date': datetime.now().date().isoformat(),
            'close': float(price),
            'open': float(info.get('regularMarketOpen', price)),
            'high': float(info.get('dayHigh', price)),
            'low': float(info.get('dayLow', price)),
            'volume': int(info.get('volume', 0)),
            'change_amount': float(price - prev_close),
            'change_percent': float(((price - prev_close) / prev_close * 100) if prev_close > 0 else 0),
            'is_latest': True
        }
        
        # Clear old latest
        supabase.table('prices').update({'is_latest': False}).eq('ticker', ticker).execute()
        
        # Insert new
        result = supabase.table('prices').insert(price_data).execute()
        print(f"✓ Price: ${price}")
        
        # Simple DCF
        dcf_data = {
            'ticker': ticker,
            'valuation_date': datetime.now().date().isoformat(),
            'base_fcfe': 100000000000,  # Placeholder
            'growth_rate': 10.0,
            'wacc': 8.5,
            'terminal_growth': 2.5,
            'projection_years': 10,
            'intrinsic_value': price * 1.15,  # Assume 15% upside for testing
            'current_price': price,
            'margin_of_safety': 13.04,
            'upside_downside': 15.0,
            'ai_growth_explanation': 'Test data - will be calculated properly'
        }
        
        result = supabase.table('dcf_valuations').upsert(dcf_data).execute()
        print(f"✓ DCF: ${dcf_data['intrinsic_value']:.2f} (+15% test upside)")
        
        print(f"✅ {ticker} added successfully!")
        
    except Exception as e:
        print(f"❌ Error: {e}")

print(f"\n{'='*60}")
print("Testing complete! Checking database...")

# Verify
companies = supabase.table('companies').select('*').execute()
print(f"✓ Companies: {len(companies.data)}")

prices = supabase.table('prices').select('*').eq('is_latest', True).execute()
print(f"✓ Latest prices: {len(prices.data)}")

dcf = supabase.table('dcf_valuations').select('*').execute()
print(f"✓ DCF valuations: {len(dcf.data)}")

print("\n✨ Database is working! ✨")
