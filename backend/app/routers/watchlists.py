"""Watchlist API routes."""

import uuid
import logging

from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.redis_client import get_redis
from app.schemas.watchlist import (
    WatchlistCreate,
    WatchlistItemAdd,
    WatchlistResponse,
    WatchlistSummary,
)
from app.services.watchlist_service import (
    get_or_create_demo_user,
    create_watchlist,
    get_watchlist_with_items,
    get_user_watchlists,
    add_item_to_watchlist,
    remove_item_from_watchlist,
    build_watchlist_response,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/watchlists", tags=["watchlists"])


def _get_user_id(x_user_id: str = Header(..., alias="X-User-Id")) -> uuid.UUID:
    """Extract user UUID from header. No real auth — demo mode."""
    try:
        return uuid.UUID(x_user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid X-User-Id header")


@router.post("", response_model=WatchlistSummary, status_code=201)
async def create_watchlist_endpoint(
    body: WatchlistCreate,
    user_id: uuid.UUID = Depends(_get_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Create a new watchlist."""
    # Ensure user exists
    await get_or_create_demo_user(db, user_id)

    watchlist = await create_watchlist(db, user_id, body.name)
    await db.commit()

    return WatchlistSummary(
        id=str(watchlist.id),
        name=watchlist.name,
        item_count=0,
    )


@router.get("/mine", response_model=list[WatchlistSummary])
async def list_my_watchlists(
    user_id: uuid.UUID = Depends(_get_user_id),
    db: AsyncSession = Depends(get_db),
):
    """List all watchlists for the current user."""
    # Ensure user exists (auto-creates default watchlist on first visit)
    await get_or_create_demo_user(db, user_id)

    watchlists = await get_user_watchlists(db, user_id)
    return [
        WatchlistSummary(
            id=str(w.id),
            name=w.name,
            item_count=len(w.items),
        )
        for w in watchlists
    ]


@router.get("/{watchlist_id}", response_model=WatchlistResponse)
async def get_watchlist_endpoint(
    watchlist_id: uuid.UUID,
    user_id: uuid.UUID = Depends(_get_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Get watchlist with live prices, z-scores, and last-seen diffs."""
    watchlist = await get_watchlist_with_items(db, watchlist_id)
    if not watchlist:
        raise HTTPException(status_code=404, detail="Watchlist not found")

    if watchlist.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not your watchlist")

    r = get_redis()
    response = await build_watchlist_response(db, r, watchlist, user_id)
    return response


@router.post("/{watchlist_id}/items", status_code=201)
async def add_item_endpoint(
    watchlist_id: uuid.UUID,
    body: WatchlistItemAdd,
    user_id: uuid.UUID = Depends(_get_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Add an instrument to a watchlist."""
    watchlist = await get_watchlist_with_items(db, watchlist_id)
    if not watchlist:
        raise HTTPException(status_code=404, detail="Watchlist not found")
    if watchlist.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not your watchlist")

    # Check if already in watchlist
    existing_symbols = {item.symbol for item in watchlist.items}
    if body.symbol in existing_symbols:
        raise HTTPException(status_code=409, detail=f"{body.symbol} already in watchlist")

    try:
        item = await add_item_to_watchlist(db, watchlist_id, body.symbol)
        await db.commit()
    except Exception as e:
        logger.error(f"Failed to add {body.symbol}: {e}")
        raise HTTPException(status_code=400, detail=f"Could not add {body.symbol}")

    return {"symbol": body.symbol, "message": f"Added {body.symbol} to watchlist"}


@router.delete("/{watchlist_id}/items/{symbol}", status_code=200)
async def remove_item_endpoint(
    watchlist_id: uuid.UUID,
    symbol: str,
    user_id: uuid.UUID = Depends(_get_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Remove an instrument from a watchlist."""
    watchlist = await get_watchlist_with_items(db, watchlist_id)
    if not watchlist:
        raise HTTPException(status_code=404, detail="Watchlist not found")
    if watchlist.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not your watchlist")

    removed = await remove_item_from_watchlist(db, watchlist_id, symbol)
    if not removed:
        raise HTTPException(status_code=404, detail=f"{symbol} not in watchlist")

    await db.commit()
    return {"symbol": symbol, "message": f"Removed {symbol} from watchlist"}
