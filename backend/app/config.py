"""Application configuration via pydantic-settings."""

import json
from typing import Any
from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """App settings, read from environment variables or .env file."""

    # Database & Cache
    DATABASE_URL: str = "sqlite+aiosqlite:///./watchlist.db"
    REDIS_URL: str = "memory://"  # "memory://" = in-memory, "redis://..." = real Redis

    # Allowed CORS origins — override via CORS_ORIGINS env var in production
    # Default permits local dev ports; set to your production domain(s) when deploying
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:8000",
    ]

    # Simulator config
    TICK_INTERVAL_SECONDS: float = 2.0
    ROLLING_WINDOW_SIZE: int = 20
    STALE_TICK_PROBABILITY: float = 0.05

    # Z-score thresholds
    Z_NOTABLE_THRESHOLD: float = 1.5
    Z_MEANINGFUL_THRESHOLD: float = 2.5
    FLAT_PERCENT_THRESHOLD: float = 0.03  # 3% fallback

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}

    @field_validator("DATABASE_URL", mode="after")
    @classmethod
    def normalize_db_url(cls, v: str) -> str:
        """Convert standard postgres:// or postgresql:// to asyncpg dialect."""
        if v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql+asyncpg://", 1)
        if v.startswith("postgresql://") and not v.startswith("postgresql+"):
            return v.replace("postgresql://", "postgresql+asyncpg://", 1)
        return v

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors(cls, v: Any) -> list[str]:
        """Support comma-separated strings, JSON arrays, or lists."""
        if isinstance(v, str):
            v_stripped = v.strip()
            if v_stripped.startswith("[") and v_stripped.endswith("]"):
                try:
                    return json.loads(v_stripped)
                except json.JSONDecodeError:
                    pass
            return [origin.strip() for origin in v_stripped.split(",") if origin.strip()]
        return v


settings = Settings()
