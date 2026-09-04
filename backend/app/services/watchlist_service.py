"""Watchlist service — orchestrates DB + Redis reads for the watchlist endpoints."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.watchlist import Watchlist, WatchlistItem
from app.models.user import User
from app.models.instrument import Instrument
from app.services.change_detection import get_instrument_stats, get_instrument_history
from app.services.last_seen_service import get_last_seen, update_last_seen_batch

# Default instruments auto-added to a new user's first watchlist
DEFAULT_WATCHLIST_SYMBOLS = ["RELIANCE", "INFY", "HDFCBANK", "TATAMOTORS", "NESTLEIND"]


async def get_or_create_demo_user(db: AsyncSession, user_id: uuid.UUID) -> User:
    """Get or create a demo user by UUID."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None:
        user = User(id=user_id, email=f"demo-{user_id}@watchlist.local")
        db.add(user)
        await db.flush()

        # Auto-create default watchlist with seeded instruments
        watchlist = Watchlist(user_id=user.id, name="My Watchlist")
        db.add(watchlist)
        await db.flush()

        for symbol in DEFAULT_WATCHLIST_SYMBOLS:
            item = WatchlistItem(watchlist_id=watchlist.id, symbol=symbol)
            db.add(item)

        await db.commit()

    return user


async def get_or_create_user_by_email(db: AsyncSession, email: str) -> User:
    """Get or create a demo user record by email address."""
    clean_email = email.strip().lower()
    result = await db.execute(select(User).where(User.email == clean_email))
    user = result.scalar_one_or_none()

    if user is None:
        user = User(id=uuid.uuid4(), email=clean_email)
        db.add(user)
        await db.flush()

        # Auto-create default watchlist with seeded instruments
        watchlist = Watchlist(user_id=user.id, name="My Watchlist")
        db.add(watchlist)
        await db.flush()

        for symbol in DEFAULT_WATCHLIST_SYMBOLS:
            item = WatchlistItem(watchlist_id=watchlist.id, symbol=symbol)
            db.add(item)

        await db.commit()

    return user


async def create_watchlist(db: AsyncSession, user_id: uuid.UUID, name: str = "My Watchlist") -> Watchlist:
    """Create a new watchlist for a user."""
    watchlist = Watchlist(user_id=user_id, name=name)
    db.add(watchlist)
    await db.flush()
    return watchlist


async def get_watchlist_with_items(db: AsyncSession, watchlist_id: uuid.UUID) -> Watchlist | None:
    """Get a watchlist with its items eagerly loaded."""
    result = await db.execute(
        select(Watchlist)
        .options(selectinload(Watchlist.items).selectinload(WatchlistItem.instrument))
        .where(Watchlist.id == watchlist_id)
    )
    return result.scalar_one_or_none()


async def get_user_watchlists(db: AsyncSession, user_id: uuid.UUID) -> list[Watchlist]:
    """Get all watchlists for a user."""
    result = await db.execute(
        select(Watchlist)
        .options(selectinload(Watchlist.items))
        .where(Watchlist.user_id == user_id)
    )
    return list(result.scalars().all())


async def add_item_to_watchlist(
    db: AsyncSession, watchlist_id: uuid.UUID, symbol: str
) -> WatchlistItem:
    """Add an instrument to a watchlist."""
    item = WatchlistItem(watchlist_id=watchlist_id, symbol=symbol)
    db.add(item)
    await db.flush()
    return item


async def remove_item_from_watchlist(
    db: AsyncSession, watchlist_id: uuid.UUID, symbol: str
) -> bool:
    """Remove an instrument from a watchlist. Returns True if found and removed."""
    result = await db.execute(
        select(WatchlistItem).where(
            WatchlistItem.watchlist_id == watchlist_id,
            WatchlistItem.symbol == symbol,
        )
    )
    item = result.scalar_one_or_none()
    if item:
        await db.delete(item)
        return True
    return False


async def build_watchlist_response(
    db: AsyncSession,
    r,  # redis.asyncio.Redis or MemoryRedis
    watchlist: Watchlist,
    user_id: uuid.UUID,
) -> dict:
    """Build the full watchlist response with live prices, z-scores, and last-seen diffs.

    This is the core endpoint response — it merges:
    1. DB data (watchlist items, instrument names)
    2. Redis data (live prices, z-scores, stats)
    3. Last-seen diffs (price delta since user's last visit)
    """
    symbols = [item.symbol for item in watchlist.items]

    # Fetch last-seen snapshots
    last_seen_map = await get_last_seen(db, user_id, symbols)

    # Build response items
    items = []
    current_prices = {}

    for item in watchlist.items:
        symbol = item.symbol
        instrument = item.instrument

        # Get live price from Redis
        price_str = await r.get(f"price:{symbol}")
        current_price = float(price_str) if price_str else None

        # Get computed stats from Redis
        stats = await get_instrument_stats(r, symbol)
        current_z = stats["z_score"] if stats else 0.0

        # Compute last-seen diff
        last_seen = last_seen_map.get(symbol)
        since_last_seen = None
        if last_seen and current_price is not None:
            last_price = last_seen["price"]
            last_z = last_seen.get("z_score", 0.0)
            price_delta = current_price - last_price
            pct_delta = (price_delta / last_price * 100) if last_price != 0 else 0
            since_last_seen = {
                "last_seen_price": last_price,
                "last_seen_at": last_seen["seen_at"],
                "price_delta": round(price_delta, 2),
                "pct_delta": round(pct_delta, 2),
                "last_seen_z_score": round(last_z, 2),
                "current_z_score": round(current_z, 2),
                "z_score": round(current_z, 2),
                "classification": stats["classification"] if stats else "noise",
            }

        item_data = {
            "symbol": symbol,
            "name": instrument.name if instrument else symbol,
            "sector": instrument.sector if instrument else None,
            "current_price": current_price,
            "added_at": item.added_at.isoformat() if item.added_at else None,
        }

        if stats:
            item_data.update({
                "z_score": stats["z_score"],
                "mean": stats["mean"],
                "stddev": stats["stddev"],
                "classification": stats["classification"],
                "history_len": stats["history_len"],
            })
        else:
            item_data.update({
                "z_score": 0.0,
                "mean": 0.0,
                "stddev": 0.0,
                "classification": "noise",
                "history_len": 0,
            })

        if since_last_seen:
            item_data["since_last_seen"] = since_last_seen
            item_data["changed_since_last_seen"] = since_last_seen

        items.append(item_data)

        if current_price is not None:
            current_prices[symbol] = {
                "price": current_price,
                "z_score": current_z,
            }

    # Update last-seen snapshots (user is viewing now)
    if current_prices:
        await update_last_seen_batch(db, user_id, current_prices)

    # Sort: flagged items first (meaningful, then notable), then noise
    classification_order = {"meaningful": 0, "notable": 1, "noise": 2}
    items.sort(key=lambda x: (classification_order.get(x.get("classification", "noise"), 2), x["symbol"]))

    return {
        "id": str(watchlist.id),
        "name": watchlist.name,
        "user_id": str(watchlist.user_id),
        "items": items,
        "flagged_count": sum(1 for i in items if i.get("classification") in ("notable", "meaningful")),
        "total_count": len(items),
    }
