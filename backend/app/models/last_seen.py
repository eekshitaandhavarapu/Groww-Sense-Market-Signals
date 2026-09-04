"""LastSeen model — tracks per-user, per-instrument snapshot."""

import uuid
from datetime import datetime

from sqlalchemy import Text, DateTime, Numeric, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class LastSeen(Base):
    __tablename__ = "last_seen"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    symbol: Mapped[str] = mapped_column(
        ForeignKey("instruments.symbol"), primary_key=True
    )
    last_seen_price: Mapped[float] = mapped_column(Numeric, nullable=False)
    last_seen_z_score: Mapped[float | None] = mapped_column(Numeric, nullable=True, default=0.0)
    last_seen_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )

    # Relationships
    user = relationship("User", back_populates="last_seen_entries")
    instrument = relationship("Instrument")
