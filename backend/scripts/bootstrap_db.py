#!/usr/bin/env python3
"""
Bootstrap Database - Populate top 50 stocks
Fetches data from yfinance and calculates DCF valuations
"""

import yfinance as yf
import os
from datetime import datetime, timedelta
from supabase import create_client, Client
import time
import numpy as np
from dotenv import load_dotenv

load_dotenv()

# Supabase connection
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Missing SUPABASE_URL or SUPABASE_KEY in environment")
    print("Please set these in .env file")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Top 50 S&P 500 stocks by market cap
TOP_50_STOCKS = [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA',
    'META', 'TSLA', 'BRK.B', 'V', 'JNJ',
    'WMT', 'XOM', 'UNH', 'JPM', 'MA',
    'PG', 'HD', 'CVX', 'MRK', 'ABBV',
    'PEP', 'KO', 'AVGO', 'COST', 'LLY',
    'MCD', 'CSCO', 'ACN', 'TMO', 'ABT',
    'NFLX', 'WFC', 'DHR', 'VZ', 'DIS',
    'ADBE', 'NKE', 'CRM', 'ORCL', 'TXN',
    'BMY', 'PM', 'INTC', 'CMCSA', 'HON',
    'UNP', 'NEE', 'AMD', 'RTX', 'QCOM'
]

def calculate_fcfe(stock_data):
    """Calculate Free Cash Flow to Equity"""
    try:
        cashflow = stock_data.cashflow
        
        if cashflow is None or cashflow.empty:
            return None
            
        # Get most recent year
        latest = cashflow.iloc[:, 0]
        
        # FCFE = Operating Cash Flow - CapEx + Net Borrowing
        operating_cf = latest.get('Operating Cash Flow', 0)
        capex = latest.get('Capital Expenditure', 0)
        
        # Net borrowing (debt issued - debt repaid)
        financing_cf = latest.get('Issuance Of Debt', 0) - abs(latest.get('Repayment Of Debt', 0))
        
        fcfe = operating_cf + capex + financing_cf  # capex is negative
        
        return fcfe if fcfe > 0 else None
        
    except Exception as e:
        print(f"  Error calculating FCFE: {e}")
        return None

def calculate_wacc(stock_data, info):
    """Calculate Weighted Average Cost of Capital"""
    try:
        # Simple WACC approximation
        # Cost of Equity = Risk-free rate + Beta * Market Risk Premium
        
        risk_free_rate = 0.045  # Current 10-year Treasury ~4.5%
        market_risk_premium = 0.07  # Historical average ~7%
        
        beta = info.get('beta', 1.0)
        if beta is None or beta <= 0:
            beta = 1.0
            
        cost_of_equity = risk_free_rate + (beta * market_risk_premium)
        
        # For simplicity, assume mostly equity-financed (can improve later)
        wacc = cost_of_equity
        
        return round(wacc, 4)
        
    except Exception as e:
        print(f"  Error calculating WACC: {e}")
        return 0.10  # Default 10%

def calculate_growth_rate(stock_data):
    """Calculate historical growth rate from financials"""
    try:
        financials = stock_data.financials
        
        if financials is None or financials.empty:
            return 0.10  # Default 10%
            
        # Get revenue over years
        if 'Total Revenue' in financials.index:
            revenues = financials.loc['Total Revenue']
            
            # Calculate YoY growth rates
            growth_rates = []
            for i in range(len(revenues) - 1):
                if revenues.iloc[i+1] != 0:
                    growth = (revenues.iloc[i] - revenues.iloc[i+1]) / abs(revenues.iloc[i+1])
                    growth_rates.append(growth)
            
            if growth_rates:
                avg_growth = np.mean(growth_rates)
                # Cap between -50% and 100%
                avg_growth = max(-0.5, min(1.0, avg_growth))
                return round(avg_growth, 4)
                
        return 0.10  # Default 10%
        
    except Exception as e:
        print(f"  Error calculating growth rate: {e}")
        return 0.10

def calculate_dcf(ticker, stock_data, info):
    """Calculate DCF valuation"""
    try:
        # 1. Get base FCFE
        fcfe = calculate_fcfe(stock_data)
        if fcfe is None or fcfe <= 0:
            print(f"  No positive FCFE for {ticker}")
            return None
            
        # 2. Calculate WACC
        wacc = calculate_wacc(stock_data, info)
        
        # 3. Estimate growth rate
        growth_rate = calculate_growth_rate(stock_data)
        
        # 4. Terminal growth rate (GDP growth)
        terminal_growth = 0.025
        
        # 5. Project cash flows (10 years)
        years = 10
        projected_fcfe = []
        
        # High growth for first 5 years, then fade
        for year in range(1, years + 1):
            if year <= 5:
                growth = growth_rate
            else:
                # Fade to terminal growth
                fade_factor = (year - 5) / 5
                growth = growth_rate * (1 - fade_factor) + terminal_growth * fade_factor
            
            fcfe = fcfe * (1 + growth)
            discount_factor = (1 + wacc) ** year
            pv = fcfe / discount_factor
            projected_fcfe.append(pv)
        
        # 6. Calculate terminal value
        terminal_fcfe = fcfe * (1 + terminal_growth)
        terminal_value = terminal_fcfe / (wacc - terminal_growth)
        pv_terminal = terminal_value / ((1 + wacc) ** years)
        
        # 7. Sum present values
        pv_projected = sum(projected_fcfe)
        enterprise_value = pv_projected + pv_terminal
        
        # 8. Adjust for net debt
        balance_sheet = stock_data.balance_sheet
        net_debt = 0
        
        if balance_sheet is not None and not balance_sheet.empty:
            latest_balance = balance_sheet.iloc[:, 0]
            total_debt = latest_balance.get('Total Debt', 0)
            cash = latest_balance.get('Cash And Cash Equivalents', 0)
            net_debt = total_debt - cash
        
        equity_value = enterprise_value - net_debt
        
        # 9. Calculate per-share value
        shares_outstanding = info.get('sharesOutstanding', 0)
        if shares_outstanding <= 0:
            print(f"  No shares outstanding data for {ticker}")
            return None
            
        intrinsic_value = equity_value / shares_outstanding
        
        # 10. Get current price
        current_price = info.get('currentPrice', info.get('regularMarketPrice', 0))
        if current_price <= 0:
            print(f"  No current price for {ticker}")
            return None
        
        # 11. Calculate margin of safety and upside
        margin_of_safety = ((intrinsic_value - current_price) / intrinsic_value) * 100
        upside_downside = ((intrinsic_value - current_price) / current_price) * 100
        
        return {
            'ticker': ticker,
            'base_fcfe': int(calculate_fcfe(stock_data) or 0),
            'growth_rate': round(growth_rate * 100, 2),
            'wacc': round(wacc * 100, 2),
            'terminal_growth': round(terminal_growth * 100, 2),
            'projection_years': years,
            'intrinsic_value': round(intrinsic_value, 2),
            'current_price': round(current_price, 2),
            'margin_of_safety': round(margin_of_safety, 2),
            'upside_downside': round(upside_downside, 2),
            'pv_projected_fcfe': int(pv_projected),
            'pv_terminal_value': int(pv_terminal),
            'enterprise_value': int(enterprise_value),
            'net_debt': int(net_debt),
            'equity_value': int(equity_value)
        }
        
    except Exception as e:
        print(f"  Error calculating DCF: {e}")
        return None

def process_stock(ticker):
    """Fetch and process a single stock"""
    print(f"\n{'='*60}")
    print(f"Processing {ticker}...")
    print(f"{'='*60}")
    
    try:
        # 1. Fetch stock data
        print(f"  Fetching data from yfinance...")
        stock = yf.Ticker(ticker)
        info = stock.info
        
        if not info or 'longName' not in info:
            print(f"  ❌ No data available for {ticker}")
            return False
        
        # 2. Insert company info
        print(f"  Inserting company: {info.get('longName')}")
        
        company_data = {
            'ticker': ticker,
            'name': info.get('longName', ticker),
            'sector': info.get('sector', 'Unknown'),
            'industry': info.get('industry', 'Unknown'),
            'description': info.get('longBusinessSummary', '')[:500],  # Limit length
            'employees': info.get('fullTimeEmployees'),
            'market_cap': info.get('marketCap'),
            'shares_outstanding': info.get('sharesOutstanding'),
            'exchange': info.get('exchange', 'NASDAQ'),
            'currency': info.get('currency', 'USD'),
            'website': info.get('website'),
            'data_verified': True,
            'data_source': 'yfinance'
        }
        
        result = supabase.table('companies').upsert(company_data).execute()
        print(f"  ✓ Company data saved")
        
        # 3. Insert current price
        print(f"  Inserting price data...")
        
        current_price = info.get('currentPrice', info.get('regularMarketPrice', 0))
        previous_close = info.get('previousClose', current_price)
        
        price_data = {
            'ticker': ticker,
            'date': datetime.now().date().isoformat(),
            'close': float(current_price),
            'open': float(info.get('regularMarketOpen', current_price)),
            'high': float(info.get('dayHigh', current_price)),
            'low': float(info.get('dayLow', current_price)),
            'volume': int(info.get('volume', 0)),
            'change_amount': float(current_price - previous_close),
            'change_percent': float(((current_price - previous_close) / previous_close * 100) if previous_close > 0 else 0),
            'is_latest': True
        }
        
        # Update any existing latest price to false first
        supabase.table('prices').update({'is_latest': False}).eq('ticker', ticker).execute()
        
        # Insert new price
        result = supabase.table('prices').insert(price_data).execute()
        print(f"  ✓ Price data saved: ${current_price}")
        
        # 4. Calculate and insert DCF valuation
        print(f"  Calculating DCF valuation...")
        
        dcf_result = calculate_dcf(ticker, stock, info)
        
        if dcf_result:
            dcf_data = {
                **dcf_result,
                'valuation_date': datetime.now().date().isoformat(),
                'ai_growth_explanation': f"Historical revenue growth rate calculated from financial statements",
                'ai_confidence': 0.75
            }
            
            result = supabase.table('dcf_valuations').upsert(dcf_data).execute()
            
            print(f"  ✓ DCF Valuation:")
            print(f"    Intrinsic Value: ${dcf_result['intrinsic_value']}")
            print(f"    Current Price: ${dcf_result['current_price']}")
            print(f"    Upside/Downside: {dcf_result['upside_downside']:.1f}%")
            print(f"    Margin of Safety: {dcf_result['margin_of_safety']:.1f}%")
        else:
            print(f"  ⚠️  Could not calculate DCF (missing financial data)")
        
        # 5. Calculate basic metrics
        print(f"  Calculating metrics...")
        
        metrics_data = {
            'ticker': ticker,
            'metric_date': datetime.now().date().isoformat(),
            'pe_ratio': info.get('trailingPE'),
            'pb_ratio': info.get('priceToBook'),
            'ps_ratio': info.get('priceToSalesTrailing12Months'),
            'roe': info.get('returnOnEquity', 0) * 100 if info.get('returnOnEquity') else None,
            'gross_margin': info.get('grossMargins', 0) * 100 if info.get('grossMargins') else None,
            'operating_margin': info.get('operatingMargins', 0) * 100 if info.get('operatingMargins') else None,
            'net_margin': info.get('profitMargins', 0) * 100 if info.get('profitMargins') else None,
            'revenue_growth': info.get('revenueGrowth', 0) * 100 if info.get('revenueGrowth') else None,
            'earnings_growth': info.get('earningsGrowth', 0) * 100 if info.get('earningsGrowth') else None,
            'debt_to_equity': info.get('debtToEquity'),
            'current_ratio': info.get('currentRatio'),
            'dividend_yield': info.get('dividendYield', 0) * 100 if info.get('dividendYield') else None
        }
        
        result = supabase.table('metrics').upsert(metrics_data).execute()
        print(f"  ✓ Metrics saved")
        
        print(f"\n✅ {ticker} processed successfully!")
        return True
        
    except Exception as e:
        print(f"\n❌ Error processing {ticker}: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Main bootstrap process"""
    print("""
╔═══════════════════════════════════════════════════════════╗
║         TradvisorAI Database Bootstrap                     ║
║         Fetching Top 50 Stocks from yfinance              ║
╚═══════════════════════════════════════════════════════════╝
""")
    
    print(f"Starting at: {datetime.now()}")
    print(f"Stocks to process: {len(TOP_50_STOCKS)}")
    print(f"Estimated time: ~15 minutes\n")
    
    successful = 0
    failed = 0
    
    for i, ticker in enumerate(TOP_50_STOCKS, 1):
        print(f"\n[{i}/{len(TOP_50_STOCKS)}] Processing {ticker}...")
        
        if process_stock(ticker):
            successful += 1
        else:
            failed += 1
        
        # Rate limiting - be nice to yfinance
        if i < len(TOP_50_STOCKS):
            print(f"  Waiting 2 seconds...")
            time.sleep(2)
    
    print(f"\n{'='*60}")
    print(f"Bootstrap Complete!")
    print(f"{'='*60}")
    print(f"✅ Successful: {successful}")
    print(f"❌ Failed: {failed}")
    print(f"Finished at: {datetime.now()}\n")
    
    # Verify database
    print("Verifying database...")
    companies = supabase.table('companies').select('ticker').execute()
    prices = supabase.table('prices').select('ticker').eq('is_latest', True).execute()
    dcf = supabase.table('dcf_valuations').select('ticker').execute()
    
    print(f"  Companies in DB: {len(companies.data)}")
    print(f"  Latest prices: {len(prices.data)}")
    print(f"  DCF valuations: {len(dcf.data)}")
    
    print("\n✨ Database is ready! ✨\n")

if __name__ == "__main__":
    main()
