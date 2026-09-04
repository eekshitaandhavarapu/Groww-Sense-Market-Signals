"""Instrument API routes."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.redis_client import get_redis
from app.models.instrument import Instrument
from app.schemas.instrument import InstrumentResponse, InstrumentHistoryResponse, CreateInstrumentRequest
from app.services.change_detection import get_instrument_stats, get_instrument_history
from app.simulator.price_feed import register_instrument_simulator

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


@router.post("", response_model=InstrumentResponse, status_code=status.HTTP_201_CREATED)
async def create_custom_instrument(
    data: CreateInstrumentRequest,
    db: AsyncSession = Depends(get_db),
):
    """Create a new custom instrument and register it in the real-time simulator feed."""
    clean_sym = data.symbol.strip().upper()
    clean_name = data.name.strip()
    clean_sector = (data.sector or "Custom / Other").strip()

    # Check if already exists in DB
    existing = await db.execute(select(Instrument).where(Instrument.symbol == clean_sym))
    inst = existing.scalar_one_or_none()

    if inst is None:
        inst = Instrument(symbol=clean_sym, name=clean_name, sector=clean_sector)
        db.add(inst)
        await db.commit()
        await db.refresh(inst)

    # Register in active simulator feed
    register_instrument_simulator(
        symbol=clean_sym,
        base_price=data.base_price,
        volatility=data.volatility,
    )

    return InstrumentResponse(
        symbol=inst.symbol,
        name=inst.name,
        sector=inst.sector,
    )


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

@router.post("/{symbol}/spike")
async def trigger_price_spike(
    symbol: str,
    direction: str = Query(default="up"),
    magnitude: float = Query(default=3.0, ge=1.5, le=6.0),
):
    """Trigger an intentional statistical anomaly price spike for live evaluation demo."""
    from app.simulator.price_feed import inject_flash_spike
    result = await inject_flash_spike(symbol, direction=direction, magnitude=magnitude)
    return result
