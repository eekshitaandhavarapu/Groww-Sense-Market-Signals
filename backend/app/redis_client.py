"""Redis client — supports both real Redis and in-memory fallback for dev."""

import logging

from app.config import settings

logger = logging.getLogger(__name__)

redis_pool = None


async def init_redis():
    """Initialize Redis. Uses in-memory adapter if REDIS_URL is 'memory://'."""
    global redis_pool

    if settings.REDIS_URL == "memory://":
        from app.memory_redis import MemoryRedis
        redis_pool = MemoryRedis()
        logger.info("Using in-memory Redis adapter (dev mode)")
    else:
        import redis.asyncio as redis
        redis_pool = redis.from_url(
            settings.REDIS_URL,
            decode_responses=True,
            max_connections=20,
        )
        logger.info(f"Connected to Redis: {settings.REDIS_URL}")

    return redis_pool


async def close_redis():
    """Close the Redis connection pool."""
    global redis_pool
    if redis_pool:
        await redis_pool.close()
        redis_pool = None


def get_redis():
    """Get the Redis client. Raises if not initialized."""
    if redis_pool is None:
        raise RuntimeError("Redis not initialized — call init_redis() first")
    return redis_pool
