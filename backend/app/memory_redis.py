"""In-memory Redis-compatible adapter for development without a Redis server.

Implements the subset of redis.asyncio.Redis API used by this project:
- get/set
- hset/hgetall
- lpush/ltrim/lrange
- publish/subscribe (pub/sub)
- pipeline

This allows the entire backend to run locally with zero infrastructure.
"""

import asyncio
import json
import logging
from collections import defaultdict
from typing import Any

logger = logging.getLogger(__name__)


class MemoryPubSub:
    """In-memory pub/sub implementation."""

    def __init__(self, broker: "PubSubBroker"):
        self._broker = broker
        self._queue: asyncio.Queue = asyncio.Queue()
        self._channels: set[str] = set()

    async def subscribe(self, *channels: str):
        for ch in channels:
            self._channels.add(ch)
            self._broker.add_subscriber(ch, self)

    async def unsubscribe(self, *channels: str):
        target_channels = channels if channels else list(self._channels)
        for ch in target_channels:
            self._channels.discard(ch)
            self._broker.remove_subscriber(ch, self)

    async def get_message(self, ignore_subscribe_messages: bool = True, timeout: float = 1.0) -> dict | None:
        try:
            msg = await asyncio.wait_for(self._queue.get(), timeout=timeout)
            return msg
        except asyncio.TimeoutError:
            return None

    def _receive(self, channel: str, data: str):
        self._queue.put_nowait({
            "type": "message",
            "channel": channel,
            "data": data,
        })

    async def close(self):
        for ch in list(self._channels):
            self._broker.remove_subscriber(ch, self)
        self._channels.clear()


class PubSubBroker:
    """Central pub/sub message broker."""

    def __init__(self):
        self._subscribers: dict[str, list[MemoryPubSub]] = defaultdict(list)

    def add_subscriber(self, channel: str, sub: MemoryPubSub):
        if sub not in self._subscribers[channel]:
            self._subscribers[channel].append(sub)

    def remove_subscriber(self, channel: str, sub: MemoryPubSub):
        if channel in self._subscribers:
            self._subscribers[channel] = [s for s in self._subscribers[channel] if s is not sub]

    def publish(self, channel: str, data: str) -> int:
        subs = self._subscribers.get(channel, [])
        for sub in subs:
            sub._receive(channel, data)
        return len(subs)


class MemoryPipeline:
    """Batches commands for sequential execution."""

    def __init__(self, store: "MemoryRedis"):
        self._store = store
        self._commands: list[tuple[str, tuple, dict]] = []

    def set(self, key: str, value: str):
        self._commands.append(("set", (key, value), {}))
        return self

    def lpush(self, key: str, *values: str):
        self._commands.append(("lpush", (key, *values), {}))
        return self

    def ltrim(self, key: str, start: int, stop: int):
        self._commands.append(("ltrim", (key, start, stop), {}))
        return self

    async def execute(self) -> list:
        results = []
        for method, args, kwargs in self._commands:
            fn = getattr(self._store, method)
            result = await fn(*args, **kwargs)
            results.append(result)
        self._commands.clear()
        return results


class MemoryRedis:
    """In-memory Redis-compatible client for development."""

    def __init__(self):
        self._data: dict[str, str] = {}
        self._lists: dict[str, list[str]] = defaultdict(list)
        self._hashes: dict[str, dict[str, str]] = defaultdict(dict)
        self._broker = PubSubBroker()

    async def get(self, key: str) -> str | None:
        return self._data.get(key)

    async def set(self, key: str, value: str) -> bool:
        self._data[key] = str(value)
        return True

    async def lpush(self, key: str, *values: str) -> int:
        for v in values:
            self._lists[key].insert(0, str(v))
        return len(self._lists[key])

    async def ltrim(self, key: str, start: int, stop: int) -> bool:
        if key in self._lists:
            self._lists[key] = self._lists[key][start:stop + 1]
        return True

    async def lrange(self, key: str, start: int, stop: int) -> list[str]:
        if key not in self._lists:
            return []
        return self._lists[key][start:stop + 1]

    async def hset(self, key: str, mapping: dict[str, str] | None = None, **kwargs) -> int:
        if mapping:
            self._hashes[key].update({k: str(v) for k, v in mapping.items()})
        if kwargs:
            self._hashes[key].update({k: str(v) for k, v in kwargs.items()})
        return len(mapping or kwargs)

    async def hgetall(self, key: str) -> dict[str, str]:
        return dict(self._hashes.get(key, {}))

    async def publish(self, channel: str, message: str) -> int:
        return self._broker.publish(channel, message)

    def pubsub(self) -> MemoryPubSub:
        return MemoryPubSub(self._broker)

    def pipeline(self) -> MemoryPipeline:
        return MemoryPipeline(self)

    async def close(self):
        self._data.clear()
        self._lists.clear()
        self._hashes.clear()
