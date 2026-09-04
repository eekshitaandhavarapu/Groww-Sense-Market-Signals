"""Z-score-based change detection service.

Handles:
- Rolling z-score computation from the 20-tick window
- Cold-start fallback (< N ticks → flat 3% threshold)
- Flat-stock fallback (std ≈ 0 → flat 3% threshold)
- Stale/out-of-order tick rejection
"""

import math
import json
import logging
from datetime import datetime, timezone
from enum import Enum

import redis.asyncio as redis

from app.config import settings

logger = logging.getLogger(__name__)

N = settings.ROLLING_WINDOW_SIZE
Z_NOTABLE = settings.Z_NOTABLE_THRESHOLD
Z_MEANINGFUL = settings.Z_MEANINGFUL_THRESHOLD
FLAT_PCT = settings.FLAT_PERCENT_THRESHOLD
STD_EPSILON = 1e-9


class ChangeClassification(str, Enum):
    NOISE = "noise"
    NOTABLE = "notable"
    MEANINGFUL = "meaningful"


def compute_z_score(prices: list[float]) -> tuple[float, float, float]:
    """Compute z-score from a list of prices.

    Returns (z_score, mean, std).

    Edge cases:
    - If len(prices) < 2, returns (0.0, prices[-1], 0.0)
    - If std ≈ 0, returns (0.0, mean, 0.0) — caller should use flat % fallback
    """
    if len(prices) < 2:
        return (0.0, prices[-1] if prices else 0.0, 0.0)

    current = prices[0]  # Most recent price (LPUSH = index 0)
    window = prices[:N]

    mean = sum(window) / len(window)
    variance = sum((p - mean) ** 2 for p in window) / len(window)
    std = math.sqrt(variance)

    if std < STD_EPSILON:
        return (0.0, mean, 0.0)

    z = (current - mean) / std
    return (z, mean, std)


def classify_change(
    z_score: float,
    current_price: float,
    mean_price: float,
    std_price: float,
    history_len: int,
) -> ChangeClassification:
    """Classify a price movement.

    Uses z-score if we have enough history AND non-zero std.
    Falls back to flat % threshold for cold-start or flat stocks.
    """
    use_flat_fallback = history_len < N or std_price < STD_EPSILON

    if use_flat_fallback:
        # Flat % threshold fallback
        if mean_price == 0:
            return ChangeClassification.NOISE
        pct_change = abs(current_price - mean_price) / mean_price
        if pct_change >= FLAT_PCT:
            return ChangeClassification.MEANINGFUL
        elif pct_change >= FLAT_PCT * 0.5:  # 1.5% for notable in flat mode
            return ChangeClassification.NOTABLE
        return ChangeClassification.NOISE

    abs_z = abs(z_score)
    if abs_z >= Z_MEANINGFUL:
        return ChangeClassification.MEANINGFUL
    elif abs_z >= Z_NOTABLE:
        return ChangeClassification.NOTABLE
    return ChangeClassification.NOISE


async def accept_tick(
    r: redis.Redis,
    symbol: str,
    price: float,
    timestamp: datetime,
) -> bool:
    """Accept or reject a tick based on timestamp ordering.

    Returns True if the tick was accepted, False if stale/duplicate.
    """
    ts_key = f"last_tick_ts:{symbol}"
    ts_str = timestamp.isoformat()

    last_ts_str = await r.get(ts_key)
    if last_ts_str:
        last_ts = datetime.fromisoformat(last_ts_str)
        if timestamp <= last_ts:
            logger.info(
                f"Rejected stale tick for {symbol}: {ts_str} <= {last_ts_str}"
            )
            return False

    await r.set(ts_key, ts_str)
    return True


async def process_tick(
    r: redis.Redis,
    symbol: str,
    price: float,
    timestamp: datetime,
) -> dict | None:
    """Process a new tick: validate, store, compute stats, publish.

    Returns the tick data dict if accepted, None if rejected.
    """
    # Guard: reject stale/out-of-order ticks
    accepted = await accept_tick(r, symbol, price, timestamp)
    if not accepted:
        return None

    price_str = f"{price:.2f}"
    ts_str = timestamp.isoformat()

    # Update Redis hot path
    pipe = r.pipeline()

    # Latest price
    pipe.set(f"price:{symbol}", price_str)

    # Rolling history (LPUSH + LTRIM to cap at N)
    pipe.lpush(f"history:{symbol}", price_str)
    pipe.ltrim(f"history:{symbol}", 0, N - 1)

    await pipe.execute()

    # Read back full history for z-score computation
    history_raw = await r.lrange(f"history:{symbol}", 0, N - 1)
    history = [float(p) for p in history_raw]

    # Compute z-score
    z_score, mean, std = compute_z_score(history)
    classification = classify_change(z_score, price, mean, std, len(history))

    # Store stats hash
    await r.hset(f"stats:{symbol}", mapping={
        "mean": f"{mean:.4f}",
        "stddev": f"{std:.4f}",
        "z_score": f"{z_score:.4f}",
        "classification": classification.value,
        "last_updated": ts_str,
        "history_len": str(len(history)),
    })

    # Build tick payload
    change_pct = round(((price - mean) / mean * 100), 2) if mean > 0 else 0.0
    tick_data = {
        "symbol": symbol,
        "price": float(price_str),
        "change_pct": change_pct,
        "timestamp": ts_str,
        "z_score": round(z_score, 4),
        "mean": round(mean, 4),
        "stddev": round(std, 4),
        "classification": classification.value,
        "history_len": len(history),
    }

    # Publish to Redis pub/sub channel
    await r.publish(f"ticks:{symbol}", json.dumps(tick_data))

    return tick_data


async def get_instrument_stats(r: redis.Redis, symbol: str) -> dict | None:
    """Get the latest computed stats for an instrument from Redis."""
    stats = await r.hgetall(f"stats:{symbol}")
    if not stats:
        return None
    return {
        "mean": float(stats.get("mean", 0)),
        "stddev": float(stats.get("stddev", 0)),
        "z_score": float(stats.get("z_score", 0)),
        "classification": stats.get("classification", "noise"),
        "last_updated": stats.get("last_updated"),
        "history_len": int(stats.get("history_len", 0)),
    }


async def get_instrument_history(r: redis.Redis, symbol: str) -> list[float]:
    """Get the rolling price history for an instrument."""
    history_raw = await r.lrange(f"history:{symbol}", 0, N - 1)
    return [float(p) for p in history_raw]
