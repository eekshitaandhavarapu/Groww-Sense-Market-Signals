"""Watchlist and WatchlistItem models."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Text, DateTime, ForeignKey, UniqueConstraint, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Watchlist(Base):
    __tablename__ = "watchlists"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(Text, nullable=False, default="My Watchlist")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    user = relationship("User", back_populates="watchlists")
    items = relationship("WatchlistItem", back_populates="watchlist", cascade="all, delete-orphan")


class WatchlistItem(Base):
    __tablename__ = "watchlist_items"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, default=uuid.uuid4
    )
    watchlist_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("watchlists.id", ondelete="CASCADE"), nullable=False
    )
    symbol: Mapped[str] = mapped_column(
        ForeignKey("instruments.symbol"), nullable=False
    )
    added_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    __table_args__ = (
        UniqueConstraint("watchlist_id", "symbol", name="uq_watchlist_symbol"),
    )

    # Relationships
    watchlist = relationship("Watchlist", back_populates="items")
    instrument = relationship("Instrument")
