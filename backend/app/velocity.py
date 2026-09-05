"""
app/velocity.py

Tier-3 (15% weight): Behavioral Velocity Bursts.

Tracks request timestamps per entity key (device_id, ip_address,
customer_id, payment_instrument_id) in rolling windows and flags sudden
bursts — e.g. 6 transactions from the same device in a 10-minute window —
which is a classic signature of scripted / automated fraud rings hammering
a payment gateway before defenses catch up.

Implemented with per-key `collections.deque` of monotonic timestamps,
pruned lazily on each read so memory stays bounded to the longest window
in use (24 hours) without any background sweep thread.
"""

from __future__ import annotations

import threading
import time
from collections import deque
from typing import Deque, Dict

from app.config import settings


class VelocityTracker:
    """Thread-safe rolling-window event counter with burst detection."""

    def __init__(self) -> None:
        self._events: Dict[str, Deque[float]] = {}
        self._lock = threading.Lock()
        self._cfg = settings.velocity

    def _prune(self, key: str, now: float) -> Deque[float]:
        dq = self._events.setdefault(key, deque())
        cutoff = now - self._cfg.long_window_seconds
        while dq and dq[0] < cutoff:
            dq.popleft()
        return dq

    def record_and_count(self, key: str, now: float | None = None) -> Dict[str, int]:
        """Records an event for `key` (e.g. 'device:Device-17') and returns
        the event counts within the short/medium/long/burst windows,
        INCLUDING the event just recorded."""
        now = now if now is not None else time.time()
        with self._lock:
            dq = self._prune(key, now)
            dq.append(now)

            short_cutoff = now - self._cfg.short_window_seconds
            medium_cutoff = now - self._cfg.medium_window_seconds
            burst_cutoff = now - self._cfg.burst_window_seconds

            short_count = sum(1 for ts in dq if ts >= short_cutoff)
            medium_count = sum(1 for ts in dq if ts >= medium_cutoff)
            long_count = len(dq)
            burst_count = sum(1 for ts in dq if ts >= burst_cutoff)

        return {
            "window_5m": short_count,
            "window_1h": medium_count,
            "window_24h": long_count,
            "window_burst_10m": burst_count,
        }

    def burst_score(self, counts: Dict[str, int]) -> float:
        """Squashes the 10-minute burst count into a [0,1] score. Anything
        at/above `burst_count_threshold` is already meaningfully suspicious;
        the score saturates rather than growing unbounded."""
        burst = counts.get("window_burst_10m", 0)
        threshold = self._cfg.burst_count_threshold
        if burst <= 1:
            return 0.0
        if burst < threshold:
            return 0.15 * (burst - 1)
        # At/above threshold: saturating curve from ~0.6 upward.
        excess = burst - threshold
        return min(1.0, 0.60 + 0.10 * excess)

    def entity_velocity_score(
        self,
        device_id: str,
        ip_address: str,
        payment_instrument_id: str,
        now: float | None = None,
    ) -> tuple[float, Dict[str, Dict[str, int]]]:
        """Computes an aggregate velocity risk score across the three
        entity dimensions that matter most for structuring/Sybil rings:
        device, IP, and payment instrument."""
        now = now if now is not None else time.time()

        device_counts = self.record_and_count(f"device:{device_id}", now)
        ip_counts = self.record_and_count(f"ip:{ip_address}", now)
        instrument_counts = self.record_and_count(f"instrument:{payment_instrument_id}", now)

        device_score = self.burst_score(device_counts)
        ip_score = self.burst_score(ip_counts)
        instrument_score = self.burst_score(instrument_counts)

        # Device and instrument bursts are the strongest tells; IP bursts
        # are weaker (shared office/NAT can cause false positives).
        composite = (0.45 * device_score) + (0.20 * ip_score) + (0.35 * instrument_score)
        composite = max(0.0, min(1.0, composite))

        breakdown = {
            "device": device_counts,
            "ip": ip_counts,
            "instrument": instrument_counts,
        }
        return composite, breakdown


# Module-level singleton shared across the FastAPI app lifespan.
velocity_tracker = VelocityTracker()
