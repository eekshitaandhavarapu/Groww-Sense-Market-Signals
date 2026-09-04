"""WebSocket endpoint — subscribes to Redis pub/sub channels for watchlist items
and fans out live tick updates to the connected client."""

import asyncio
import json
import logging
import uuid

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import async_session
from app.models.watchlist import Watchlist, WatchlistItem
from app.redis_client import get_redis

logger = logging.getLogger(__name__)

router = APIRouter()


@router.websocket("/ws/watchlist/{watchlist_id}")
async def watchlist_ws(websocket: WebSocket, watchlist_id: str):
    """WebSocket endpoint for live price updates.

    Lifecycle:
    1. Validates UUID format and existence in DB.
       - Invalid UUID -> closes with code 4000.
       - Non-existent Watchlist -> closes with code 4004.
    2. Subscribes to Redis pub/sub channels (ticks:{symbol}) for all watchlist items.
    3. Streams tick JSON frames: { symbol, price, change_pct, z_score, classification, timestamp }.
    4. Supports dynamic subscribe/unsubscribe commands from client.
    5. Clean teardown: whether normal exit or abrupt disconnect, unsubscribes and closes pubsub.
    """
    await websocket.accept()

    try:
        wl_uuid = uuid.UUID(watchlist_id)
    except ValueError:
        await websocket.close(code=4000, reason="Invalid watchlist ID")
        return

    # Look up watchlist items in database
    async with async_session() as db:
        result = await db.execute(
            select(Watchlist)
            .options(selectinload(Watchlist.items))
            .where(Watchlist.id == wl_uuid)
        )
        watchlist = result.scalar_one_or_none()

    if not watchlist:
        await websocket.close(code=4004, reason="Watchlist not found")
        return

    symbols = set(item.symbol for item in watchlist.items)

    # Initialize Redis pub/sub
    r = get_redis()
    pubsub = r.pubsub()
    channels = [f"ticks:{s}" for s in symbols]
    if channels:
        await pubsub.subscribe(*channels)

    logger.info(f"WS connected for watchlist {watchlist_id} with symbols: {list(symbols)}")

    async def forward_ticks():
        """Reads tick messages from Redis pub/sub and pushes JSON frames to the client."""
        while True:
            msg = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
            if msg and msg.get("type") == "message":
                raw_data = msg["data"]
                # Send JSON frame to client
                if isinstance(raw_data, bytes):
                    raw_data = raw_data.decode("utf-8")
                await websocket.send_text(raw_data)
            await asyncio.sleep(0.01)

    async def receive_client_commands():
        """Listens for dynamic subscription updates or ping from client."""
        while True:
            text = await websocket.receive_text()
            try:
                cmd = json.loads(text)
                action = cmd.get("action")
                symbol = cmd.get("symbol")
                if action == "subscribe" and symbol:
                    ch = f"ticks:{symbol}"
                    await pubsub.subscribe(ch)
                    symbols.add(symbol)
                    logger.info(f"WS [{watchlist_id}] subscribed to {ch}")
                elif action == "unsubscribe" and symbol:
                    ch = f"ticks:{symbol}"
                    await pubsub.unsubscribe(ch)
                    symbols.discard(symbol)
                    logger.info(f"WS [{watchlist_id}] unsubscribed from {ch}")
            except (json.JSONDecodeError, Exception) as parse_err:
                logger.debug(f"WS received unhandled message: {parse_err}")

    # Run sender and receiver concurrently
    sender_task = asyncio.create_task(forward_ticks())
    receiver_task = asyncio.create_task(receive_client_commands())

    try:
        done, pending = await asyncio.wait(
            [sender_task, receiver_task],
            return_when=asyncio.FIRST_EXCEPTION,
        )
        for task in done:
            if task.exception():
                raise task.exception()
    except (WebSocketDisconnect, ConnectionResetError, BrokenPipeError):
        logger.info(f"WS client disconnected for watchlist {watchlist_id}")
    except asyncio.CancelledError:
        logger.info(f"WS connection task cancelled for watchlist {watchlist_id}")
    except Exception as e:
        logger.error(f"WS error for watchlist {watchlist_id}: {e}")
    finally:
        sender_task.cancel()
        receiver_task.cancel()
        # Clean up Redis pubsub subscription completely to prevent leaks
        try:
            if symbols:
                await pubsub.unsubscribe()
            await pubsub.close()
            logger.info(f"WS pubsub cleaned up for watchlist {watchlist_id}")
        except Exception as cleanup_err:
            logger.warning(f"Pubsub cleanup error: {cleanup_err}")
