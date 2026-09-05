"""
app/storage.py

Tier-1 in-memory high-speed cache described in the architecture:

- `IdempotencyStore`: O(1) duplicate-transaction check (a plain dict keyed
  by transaction_id, with TTL-based eviction so the map doesn't grow
  unbounded across a long-running process).
- `RecentTransactionsBuffer`: a fixed-size circular buffer (`collections.deque`
  with `maxlen`) holding the last N evaluated transactions for fast
  cold-start queries via GET /api/transactions.

Both structures are thread-safe (guarded by `threading.Lock`) so they can
be safely shared across the async event loop and any background threads
(e.g. a model-reload thread) without corruption.
"""

from __future__ import annotations

import threading
import time
from collections import deque
from typing import Deque, Dict, List, Optional

from app.config import settings
from app.schemas import TransactionResult


class IdempotencyStore:
    """Thread-safe O(1) duplicate-transaction detector with TTL eviction."""

    def __init__(self, ttl_seconds: int = settings.idempotency_ttl_seconds) -> None:
        self._ttl_seconds = ttl_seconds
        self._map: Dict[str, float] = {}
        self._lock = threading.Lock()

    def seen_before(self, transaction_id: str) -> bool:
        """Returns True if this transaction_id was already processed
        (and not yet expired). Marks it as seen as a side effect if new."""
        now = time.time()
        with self._lock:
            self._evict_expired(now)
            if transaction_id in self._map:
                return True
            self._map[transaction_id] = now
            return False

    def _evict_expired(self, now: float) -> None:
        if len(self._map) < 5000:
            # Cheap size check to avoid scanning the whole map on every
            # single call once it's small; still evicts eventually.
            return
        expired = [tx_id for tx_id, ts in self._map.items() if now - ts > self._ttl_seconds]
        for tx_id in expired:
            del self._map[tx_id]

    def size(self) -> int:
        with self._lock:
            return len(self._map)


class RecentTransactionsBuffer:
    """Thread-safe fixed-size circular buffer of the most recent results."""

    def __init__(self, max_size: int = settings.recent_buffer_size) -> None:
        self._buffer: Deque[TransactionResult] = deque(maxlen=max_size)
        self._by_id: Dict[str, TransactionResult] = {}
        self._lock = threading.Lock()

    def add(self, result: TransactionResult) -> None:
        with self._lock:
            if len(self._buffer) == self._buffer.maxlen and self._buffer:
                oldest = self._buffer[0]
                self._by_id.pop(oldest.id, None)
            self._buffer.append(result)
            self._by_id[result.id] = result

    def recent(self, limit: Optional[int] = None) -> List[TransactionResult]:
        with self._lock:
            items = list(self._buffer)[::-1]  # newest first
        if limit is not None:
            return items[:limit]
        return items

    def get(self, transaction_id: str) -> Optional[TransactionResult]:
        with self._lock:
            return self._by_id.get(transaction_id)

    def all_for_ring(self, ring_id: str) -> List[TransactionResult]:
        with self._lock:
            return [tx for tx in self._buffer if tx.ringId == ring_id]

    def size(self) -> int:
        with self._lock:
            return len(self._buffer)


# Module-level singletons shared across the FastAPI app lifespan.
idempotency_store = IdempotencyStore()
recent_transactions_buffer = RecentTransactionsBuffer()
