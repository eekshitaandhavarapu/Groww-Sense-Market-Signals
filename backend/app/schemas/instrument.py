"""Pydantic schemas for instrument API."""

from pydantic import BaseModel, Field


class CreateInstrumentRequest(BaseModel):
    symbol: str = Field(..., min_length=1, max_length=20)
    name: str = Field(..., min_length=1, max_length=100)
    sector: str | None = Field(default="General", max_length=50)
    base_price: float = Field(default=1000.0, gt=0)
    volatility: float = Field(default=0.015, gt=0, le=0.5)


class InstrumentResponse(BaseModel):
    symbol: str
    name: str
    sector: str | None = None


class InstrumentHistoryResponse(BaseModel):
    symbol: str
    prices: list[float]
    mean: float
    stddev: float
    z_score: float
    classification: str
    upper_band: list[float]
    lower_band: list[float]
