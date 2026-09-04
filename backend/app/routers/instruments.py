"""Instrument API routes."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.redis_client import get_redis
from app.models.instrument import Instrument
from app.schemas.instrument import InstrumentResponse, InstrumentHistoryResponse
from app.services.change_detection import get_instrument_stats, get_instrument_history

router = APIRouter(prefix="/instruments", tags=["instruments"])


@router.get("", response_model=list[InstrumentResponse])
async def list_instruments(
    q: str = Query(default="", max_length=50),
    db: AsyncSession = Depends(get_db),
):
    """List available instruments, optionally filtered by search query."""
    query = select(Instrument)
    if q:
        query = query.where(
            Instrument.symbol.ilike(f"%{q}%") | Instrument.name.ilike(f"%{q}%")
        )
    query = query.order_by(Instrument.symbol)

    result = await db.execute(query)
    instruments = result.scalars().all()

    return [
        InstrumentResponse(
            symbol=inst.symbol,
            name=inst.name,
            sector=inst.sector,
        )
        for inst in instruments
    ]


@router.get("/{symbol}/history", response_model=InstrumentHistoryResponse)
async def get_history(symbol: str):
    """Get rolling price history and stats for the explainability sparkline."""
    r = get_redis()

    prices = await get_instrument_history(r, symbol)
    if not prices:
        raise HTTPException(status_code=404, detail=f"No history for {symbol}")

    stats = await get_instrument_stats(r, symbol)
    mean = stats["mean"] if stats else 0
    stddev = stats["stddev"] if stats else 0
    z_score = stats["z_score"] if stats else 0
    classification = stats["classification"] if stats else "noise"

    # Compute bands (mean ± 1 std) for each data point position
    upper_band = [mean + stddev] * len(prices)
    lower_band = [mean - stddev] * len(prices)

    return InstrumentHistoryResponse(
        symbol=symbol,
        prices=prices,
        mean=round(mean, 2),
        stddev=round(stddev, 2),
        z_score=round(z_score, 4),
        classification=classification,
        upper_band=[round(v, 2) for v in upper_band],
        lower_band=[round(v, 2) for v in lower_band],
    )
