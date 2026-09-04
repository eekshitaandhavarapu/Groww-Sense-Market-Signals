"""Pydantic schemas for watchlist API."""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class WatchlistCreate(BaseModel):
    name: str = Field(default="My Watchlist", max_length=100)


class WatchlistItemAdd(BaseModel):
    symbol: str = Field(..., min_length=1, max_length=20)


class ChangedSinceLastSeen(BaseModel):
    last_seen_price: float
    last_seen_at: str
    price_delta: float
    pct_delta: float
    last_seen_z_score: float | None = 0.0
    current_z_score: float | None = 0.0
    z_score: float = 0.0
    classification: str = "noise"


# Keep SinceLastSeen as an alias for backwards compatibility
SinceLastSeen = ChangedSinceLastSeen


class WatchlistItemResponse(BaseModel):
    symbol: str
    name: str
    sector: str | None = None
    current_price: float | None = None
    z_score: float = 0.0
    mean: float = 0.0
    stddev: float = 0.0
    classification: str = "noise"
    history_len: int = 0
    added_at: str | None = None
    changed_since_last_seen: ChangedSinceLastSeen | None = None
    since_last_seen: ChangedSinceLastSeen | None = None


class WatchlistResponse(BaseModel):
    id: str
    name: str
    user_id: str
    items: list[WatchlistItemResponse]
    flagged_count: int
    total_count: int


class WatchlistSummary(BaseModel):
    id: str
    name: str
    item_count: int
