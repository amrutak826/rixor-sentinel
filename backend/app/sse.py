"""
app/sse.py

Server-Sent Events broadcast pipeline for GET /api/transactions/stream.

Every connected analyst dashboard opens one long-lived HTTP connection.
When a new transaction is scored, `broadcast_new_transaction()` fans the
serialized result out to every connected client's `asyncio.Queue`. Each
client's own generator (`sse_event_generator`) drains its queue and yields
`data: {...}\n\n` frames, which is the wire format the browser's
`EventSource` API expects.

A queue-per-client design (rather than a single shared broadcast queue)
means one slow/disconnected client can never block delivery to the others,
and a full queue simply drops the oldest event for that one client instead
of applying backpressure to the ingestion pipeline.
"""

from __future__ import annotations

import asyncio
import json
from typing import AsyncGenerator, Set

from app.schemas import TransactionResult

_MAX_QUEUE_SIZE = 200


class SSEBroadcaster:
    def __init__(self) -> None:
        self._clients: Set["asyncio.Queue[str]"] = set()
        self._lock = asyncio.Lock()

    async def connect(self) -> "asyncio.Queue[str]":
        queue: "asyncio.Queue[str]" = asyncio.Queue(maxsize=_MAX_QUEUE_SIZE)
        async with self._lock:
            self._clients.add(queue)
        return queue

    async def disconnect(self, queue: "asyncio.Queue[str]") -> None:
        async with self._lock:
            self._clients.discard(queue)

    async def broadcast(self, payload: dict) -> None:
        message = json.dumps(payload, default=str)
        async with self._lock:
            targets = list(self._clients)
        for queue in targets:
            if queue.full():
                # Drop the oldest queued event for this slow client rather
                # than blocking the whole broadcast on it.
                try:
                    queue.get_nowait()
                except asyncio.QueueEmpty:
                    pass
            try:
                queue.put_nowait(message)
            except asyncio.QueueFull:
                pass

    def connected_client_count(self) -> int:
        return len(self._clients)


broadcaster = SSEBroadcaster()


async def broadcast_new_transaction(result: TransactionResult) -> None:
    await broadcaster.broadcast(json.loads(result.model_dump_json()))


async def sse_event_generator(queue: "asyncio.Queue[str]") -> AsyncGenerator[str, None]:
    """Yields SSE-formatted frames; sends a keep-alive comment every 15s
    of inactivity so intermediary proxies don't close the connection."""
    try:
        while True:
            try:
                message = await asyncio.wait_for(queue.get(), timeout=15.0)
                yield f"data: {message}\n\n"
            except asyncio.TimeoutError:
                yield ": keep-alive\n\n"
    except asyncio.CancelledError:
        raise
    finally:
        await broadcaster.disconnect(queue)
