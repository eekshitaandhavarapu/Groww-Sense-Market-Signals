"""Simulated price feed — generates realistic ticks per instrument.

Runs as a single asyncio background task during app lifespan.

Features:
- Random-walk price generation per instrument: price += price * gauss(0, vol)
- Instruments have pre-assigned volatility (high/med/low)
- 5% of ticks are deliberately stale or duplicated to exercise edge-case handling
- Ticks are processed through the change detection pipeline
"""

import asyncio
import logging
import random
from datetime import datetime, timezone, timedelta

from app.redis_client import get_redis
from app.services.change_detection import process_tick
from app.config import settings

logger = logging.getLogger(__name__)

# Instrument definitions with base prices and volatilities
INSTRUMENTS = {
    # High volatility
    "RELIANCE": {"base_price": 2800.0, "volatility": 0.025},
    "TATAMOTORS": {"base_price": 600.0, "volatility": 0.030},
    "ADANIENT": {"base_price": 2400.0, "volatility": 0.028},
    "ZOMATO": {"base_price": 250.0, "volatility": 0.026},
    "BAJFINANCE": {"base_price": 7100.0, "volatility": 0.022},
    # Medium volatility
    "INFY": {"base_price": 1520.0, "volatility": 0.012},
    "TCS": {"base_price": 3400.0, "volatility": 0.010},
    "HDFCBANK": {"base_price": 1640.0, "volatility": 0.011},
    "WIPRO": {"base_price": 450.0, "volatility": 0.013},
    "ICICIBANK": {"base_price": 1100.0, "volatility": 0.012},
    "SBIN": {"base_price": 780.0, "volatility": 0.014},
    "BHARTIARTL": {"base_price": 1550.0, "volatility": 0.012},
    "KOTAKBANK": {"base_price": 1780.0, "volatility": 0.011},
    # Low volatility
    "NESTLEIND": {"base_price": 2300.0, "volatility": 0.005},
    "HINDUNILVR": {"base_price": 2500.0, "volatility": 0.004},
    "PIDILITIND": {"base_price": 2700.0, "volatility": 0.005},
    "ITC": {"base_price": 480.0, "volatility": 0.006},
    "SUNPHARMA": {"base_price": 1820.0, "volatility": 0.007},
}

# Current prices (initialized from base prices)
current_prices: dict[str, float] = {}
# Track last tick timestamps per symbol (for stale tick simulation)
last_tick_times: dict[str, datetime] = {}


async def run_price_feed():
    """Main price feed loop — runs every ~2 seconds.

    For each instrument on each tick:
    1. Generate a new price via random walk
    2. With 5% probability, simulate a stale/duplicate tick
    3. Process the tick through change detection (Redis pipeline)
    """
    r = get_redis()

    # Initialize current prices
    for symbol, config in INSTRUMENTS.items():
        current_prices[symbol] = config["base_price"]
        last_tick_times[symbol] = datetime.now(timezone.utc)

    logger.info(f"Price feed started for {len(INSTRUMENTS)} instruments")

    tick_count = 0
    while True:
        try:
            now = datetime.now(timezone.utc)
            tick_count += 1

            for symbol, config in INSTRUMENTS.items():
                volatility = config["volatility"]

                # Random walk: price *= (1 + gauss(0, vol))
                change = random.gauss(0, volatility)
                new_price = current_prices[symbol] * (1 + change)

                # Prevent negative prices
                new_price = max(new_price, 1.0)

                # Determine timestamp and whether to simulate edge cases
                tick_timestamp = now

                if random.random() < settings.STALE_TICK_PROBABILITY:
                    # ~5% chance: simulate a stale tick (old timestamp)
                    stale_delay = random.uniform(3, 8)
                    tick_timestamp = now - timedelta(seconds=stale_delay)
                    logger.debug(
                        f"Simulating STALE tick for {symbol}: "
                        f"ts={tick_timestamp.isoformat()} (delayed {stale_delay:.1f}s)"
                    )
                elif random.random() < settings.STALE_TICK_PROBABILITY:
                    # Another ~5% chance: duplicate tick (same price + old timestamp)
                    tick_timestamp = last_tick_times.get(symbol, now)
                    new_price = current_prices[symbol]  # Same price
                    logger.debug(
                        f"Simulating DUPLICATE tick for {symbol}: "
                        f"price={new_price:.2f}, ts={tick_timestamp.isoformat()}"
                    )

                # Process through change detection pipeline
                result = await process_tick(r, symbol, new_price, tick_timestamp)

                if result:
                    # Tick was accepted — update local state
                    current_prices[symbol] = new_price
                    last_tick_times[symbol] = tick_timestamp

                    if result["classification"] != "noise":
                        logger.info(
                            f"[{result['classification'].upper()}] {symbol}: "
                            f"₹{new_price:.2f} | z={result['z_score']:.2f}σ"
                        )

            # Log periodic summary
            if tick_count % 30 == 0:
                logger.info(f"Tick #{tick_count} completed for all instruments")

        except Exception as e:
            logger.error(f"Price feed error on tick #{tick_count}: {e}")

        await asyncio.sleep(settings.TICK_INTERVAL_SECONDS)
