"""FastAPI application — lifespan, middleware, and route registration."""

import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db
from app.redis_client import init_redis, close_redis
from app.routers import watchlists, instruments, auth
from app.ws.watchlist_ws import router as ws_router
from app.simulator.price_feed import run_price_feed

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


async def seed_instruments_if_empty():
    """Seed instruments table if it's empty (first run)."""
    from app.database import async_session
    from app.models.instrument import Instrument
    from sqlalchemy import select, func

    async with async_session() as session:
        count_result = await session.execute(select(func.count()).select_from(Instrument))
        count = count_result.scalar()

        if count == 0:
            from seed import INSTRUMENTS
            for inst in INSTRUMENTS:
                session.add(Instrument(
                    symbol=inst["symbol"],
                    name=inst["name"],
                    sector=inst.get("sector"),
                ))
            await session.commit()
            logger.info(f"Seeded {len(INSTRUMENTS)} instruments")
        else:
            logger.info(f"Found {count} instruments already seeded")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """App lifespan — initialize DB, Redis, seed data, start simulator."""
    logger.info("Starting Smart Watchlist backend...")

    # Initialize database (create tables for SQLite)
    await init_db()
    # Import models to ensure they're registered
    from app.models import User, Watchlist, WatchlistItem, Instrument, LastSeen  # noqa: F401
    await init_db()
    logger.info("Database initialized")

    # Seed instruments
    await seed_instruments_if_empty()

    # Initialize Redis (real or in-memory)
    await init_redis()
    logger.info("Redis initialized")

    # Start the price feed simulator as a background task
    feed_task = asyncio.create_task(run_price_feed())
    logger.info("Price feed simulator started")

    yield

    # Shutdown
    logger.info("Shutting down...")
    feed_task.cancel()
    try:
        await feed_task
    except asyncio.CancelledError:
        pass
    await close_redis()
    logger.info("Shutdown complete")


app = FastAPI(
    title="Smart Market Watchlist",
    description="Volatility-aware watchlist with z-score-based change detection",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers (accessible at both /api/... and /...)
app.include_router(watchlists.router, prefix="/api")
app.include_router(watchlists.router)
app.include_router(instruments.router, prefix="/api")
app.include_router(instruments.router)
app.include_router(auth.router, prefix="/api")
app.include_router(auth.router)
app.include_router(ws_router)


@app.api_route("/api/health", methods=["GET", "HEAD"])
@app.api_route("/health", methods=["GET", "HEAD"])
async def health():
    return {"status": "ok", "service": "smart-watchlist"}


# Mount built frontend at root if present — enables serving entire full-stack app from one single port & folder
from pathlib import Path
from fastapi.staticfiles import StaticFiles

_frontend_dist = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
if not _frontend_dist.exists():
    _frontend_dist = Path(__file__).resolve().parent.parent / "dist"

if _frontend_dist.exists():
    app.mount("/", StaticFiles(directory=str(_frontend_dist), html=True), name="frontend")

