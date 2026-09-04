"""Pydantic schemas for instrument API."""

from pydantic import BaseModel


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
