"""Seed script — populates the instruments table with demo data."""

import asyncio
import sys
from pathlib import Path

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent if Path(__file__).parent.name == "scripts" else Path(__file__).resolve().parent))

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.config import settings

INSTRUMENTS = [
    # High volatility
    {"symbol": "RELIANCE", "name": "Reliance Industries", "sector": "Energy", "base_price": 2800, "volatility": 0.025},
    {"symbol": "TATAMOTORS", "name": "Tata Motors", "sector": "Auto", "base_price": 600, "volatility": 0.030},
    {"symbol": "ADANIENT", "name": "Adani Enterprises", "sector": "Infra", "base_price": 2400, "volatility": 0.028},
    {"symbol": "ZOMATO", "name": "Zomato", "sector": "Tech / Food", "base_price": 250, "volatility": 0.026},
    {"symbol": "BAJFINANCE", "name": "Bajaj Finance", "sector": "Financial Services", "base_price": 7100, "volatility": 0.022},
    # Medium volatility
    {"symbol": "INFY", "name": "Infosys", "sector": "IT", "base_price": 1520, "volatility": 0.012},
    {"symbol": "TCS", "name": "TCS", "sector": "IT", "base_price": 3400, "volatility": 0.010},
    {"symbol": "HDFCBANK", "name": "HDFC Bank", "sector": "Banking", "base_price": 1640, "volatility": 0.011},
    {"symbol": "WIPRO", "name": "Wipro", "sector": "IT", "base_price": 450, "volatility": 0.013},
    {"symbol": "ICICIBANK", "name": "ICICI Bank", "sector": "Banking", "base_price": 1100, "volatility": 0.012},
    {"symbol": "SBIN", "name": "State Bank of India", "sector": "Banking", "base_price": 780, "volatility": 0.014},
    {"symbol": "BHARTIARTL", "name": "Bharti Airtel", "sector": "Telecom", "base_price": 1550, "volatility": 0.012},
    {"symbol": "KOTAKBANK", "name": "Kotak Mahindra Bank", "sector": "Banking", "base_price": 1780, "volatility": 0.011},
    # Low volatility
    {"symbol": "NESTLEIND", "name": "Nestlé India", "sector": "FMCG", "base_price": 2300, "volatility": 0.005},
    {"symbol": "HINDUNILVR", "name": "Hindustan Unilever", "sector": "FMCG", "base_price": 2500, "volatility": 0.004},
    {"symbol": "PIDILITIND", "name": "Pidilite Industries", "sector": "Chemicals", "base_price": 2700, "volatility": 0.005},
    {"symbol": "ITC", "name": "ITC Limited", "sector": "FMCG", "base_price": 480, "volatility": 0.006},
    {"symbol": "SUNPHARMA", "name": "Sun Pharma", "sector": "Healthcare", "base_price": 1820, "volatility": 0.007},
]

# Default watchlist instruments (auto-added on first visit)
DEFAULT_WATCHLIST_SYMBOLS = ["RELIANCE", "INFY", "HDFCBANK", "TATAMOTORS", "NESTLEIND"]


async def seed():
    engine = create_async_engine(settings.DATABASE_URL)
    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with session_factory() as session:
        # Upsert instruments
        for inst in INSTRUMENTS:
            await session.execute(
                text(
                    """
                    INSERT INTO instruments (symbol, name, sector)
                    VALUES (:symbol, :name, :sector)
                    ON CONFLICT (symbol) DO UPDATE SET name = :name, sector = :sector
                    """
                ),
                {"symbol": inst["symbol"], "name": inst["name"], "sector": inst["sector"]},
            )
        await session.commit()
        print(f"Seeded {len(INSTRUMENTS)} instruments.")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed())
