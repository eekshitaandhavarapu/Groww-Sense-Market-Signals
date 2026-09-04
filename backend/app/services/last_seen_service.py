"""Last-seen snapshot service — tracks what the user saw on their last visit."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.last_seen import LastSeen


async def get_last_seen(
    db: AsyncSession, user_id: uuid.UUID, symbols: list[str]
) -> dict[str, dict]:
    """Get last-seen snapshots for a user's symbols.

    Returns { symbol: { price, seen_at } }.
    """
    if not symbols:
        return {}

    result = await db.execute(
        select(LastSeen).where(
            LastSeen.user_id == user_id,
            LastSeen.symbol.in_(symbols),
        )
    )
    rows = result.scalars().all()

    return {
        row.symbol: {
            "price": float(row.last_seen_price),
            "z_score": float(row.last_seen_z_score or 0.0),
            "seen_at": row.last_seen_at.isoformat() if row.last_seen_at else None,
        }
        for row in rows
    }


async def update_last_seen(
    db: AsyncSession,
    user_id: uuid.UUID,
    symbol: str,
    price: float,
    z_score: float = 0.0,
    timestamp: datetime | None = None,
) -> None:
    """Upsert the last-seen snapshot for a user + symbol."""
    if timestamp is None:
        timestamp = datetime.now(timezone.utc)

    result = await db.execute(
        select(LastSeen).where(
            LastSeen.user_id == user_id,
            LastSeen.symbol == symbol,
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        existing.last_seen_price = price
        existing.last_seen_z_score = z_score
        existing.last_seen_at = timestamp
    else:
        db.add(LastSeen(
            user_id=user_id,
            symbol=symbol,
            last_seen_price=price,
            last_seen_z_score=z_score,
            last_seen_at=timestamp,
        ))


async def update_last_seen_batch(
    db: AsyncSession,
    user_id: uuid.UUID,
    snapshots: dict[str, dict],  # symbol -> {"price": float, "z_score": float}
) -> None:
    """Batch update last-seen for multiple symbols."""
    now = datetime.now(timezone.utc)
    for symbol, data in snapshots.items():
        price = data["price"] if isinstance(data, dict) else float(data)
        z_score = data.get("z_score", 0.0) if isinstance(data, dict) else 0.0
        await update_last_seen(db, user_id, symbol, price, z_score, now)
    await db.commit()
