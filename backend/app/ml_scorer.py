"""
app/ml_scorer.py

Tier-3 (40% weight): Supervised ML — Gradient Boosted Decision Trees.

Feature vector (matches spec section 3A):
    1. Transaction amount, normalized to INR.
    2. Velocity of requests per device / IP over 5m, 1h, 24h windows.
    3. Device environment flags (headless, emulator, BlueStacks, scraper).
    4. Time-of-day entropy and merchant category risk index.

Design notes:
    - `MLRiskScorer` will load a trained XGBoost model from
      `settings.model_path` (produced by `ml/train_model.py`) if present.
    - If no trained model artifact exists yet (e.g. a fresh clone before
      anyone has run the training script), it falls back to a fully
      deterministic, hand-calibrated logistic heuristic over the exact
      same feature vector. This is NOT a stub — it is a real, monotonic
      scoring function that produces sane risk scores out of the box, and
      it is transparently swapped out the moment `model.pkl` exists.
"""

from __future__ import annotations

import math
import os
import threading
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Dict, Optional

import numpy as np

from app.config import settings
from app.schemas import DeviceFlags

FEATURE_NAMES = [
    "amount_log_inr",
    "velocity_5m",
    "velocity_1h",
    "velocity_24h",
    "device_headless",
    "device_emulator",
    "device_bluestacks",
    "device_scraper",
    "time_of_day_entropy",
    "merchant_risk_index",
]


def time_of_day_entropy(ts: datetime) -> float:
    """A simple entropy-like proxy for 'unusual hour' risk: transactions
    clustered in the 1am-5am local-equivalent window (common for
    automated scripted fraud, since human customers rarely shop then)
    score higher. Returns a value in [0, 1]."""
    ts = ts.astimezone(timezone.utc) if ts.tzinfo else ts
    hour = ts.hour + ts.minute / 60.0
    # Gaussian bump centered at 3am UTC, width ~2.5 hours.
    center, width = 3.0, 2.5
    return float(math.exp(-0.5 * ((hour - center) / width) ** 2))


def merchant_risk_index(merchant_id: str) -> float:
    return 1.0 if merchant_id in settings.high_risk_merchant_categories else 0.15


def build_feature_vector(
    amount: float,
    velocity_counts: Dict[str, int],
    device_flags: Optional[DeviceFlags],
    timestamp: datetime,
    merchant_id: str,
) -> np.ndarray:
    df = device_flags or DeviceFlags()
    features = [
        math.log1p(max(amount, 0.0)),
        float(velocity_counts.get("window_5m", 0)),
        float(velocity_counts.get("window_1h", 0)),
        float(velocity_counts.get("window_24h", 0)),
        1.0 if df.headless_browser else 0.0,
        1.0 if df.emulator_container else 0.0,
        1.0 if df.android_bluestacks else 0.0,
        1.0 if df.linux_scraper_script else 0.0,
        time_of_day_entropy(timestamp),
        merchant_risk_index(merchant_id),
    ]
    return np.array(features, dtype=np.float64).reshape(1, -1)


def _heuristic_score(features: np.ndarray) -> float:
    """Hand-calibrated monotonic logistic scorer used when no trained
    XGBoost artifact is available. Weights were chosen so that a
    "clean" low-velocity daytime transaction on a normal browser scores
    well under 0.2, and a scripted burst at 3am on an emulator scores
    above 0.85 — matching the qualitative bands the spec describes."""
    (
        amount_log,
        v5m,
        v1h,
        v24h,
        headless,
        emulator,
        bluestacks,
        scraper,
        tod_entropy,
        merchant_risk,
    ) = features.flatten()

    z = (
        -3.4
        + 0.18 * amount_log
        + 0.55 * min(v5m, 10)
        + 0.12 * min(v1h, 30)
        + 0.02 * min(v24h, 100)
        + 1.6 * headless
        + 1.8 * emulator
        + 1.3 * bluestacks
        + 1.4 * scraper
        + 1.1 * tod_entropy
        + 0.9 * merchant_risk
    )
    return float(1.0 / (1.0 + math.exp(-z)))


@dataclass
class MLScoreResult:
    score: float
    features: Dict[str, float]
    model_backend: str  # "xgboost" | "heuristic_fallback"


class MLRiskScorer:
    """Loads a trained model lazily and thread-safely; falls back to the
    calibrated heuristic if no artifact is present or loading fails."""

    def __init__(self, model_path: str = settings.model_path) -> None:
        self._model_path = model_path
        self._model = None
        self._backend = "heuristic_fallback"
        self._lock = threading.Lock()
        self._load_attempted = False

    def _ensure_loaded(self) -> None:
        if self._load_attempted:
            return
        with self._lock:
            if self._load_attempted:
                return
            self._load_attempted = True
            if os.path.exists(self._model_path):
                try:
                    import joblib  # local import: optional heavy dependency

                    self._model = joblib.load(self._model_path)
                    self._backend = "xgboost"
                except Exception:
                    # Corrupt or incompatible artifact -> safe fallback,
                    # never crash the ingestion pipeline over a model file.
                    self._model = None
                    self._backend = "heuristic_fallback"

    def reload(self) -> None:
        """Forces a re-check of the model artifact (e.g. after a fresh
        training run has written a new model.pkl to disk)."""
        with self._lock:
            self._load_attempted = False
        self._ensure_loaded()

    def score(
        self,
        amount: float,
        velocity_counts: Dict[str, int],
        device_flags: Optional[DeviceFlags],
        timestamp: datetime,
        merchant_id: str,
    ) -> MLScoreResult:
        self._ensure_loaded()
        feature_vector = build_feature_vector(amount, velocity_counts, device_flags, timestamp, merchant_id)
        feature_dict = dict(zip(FEATURE_NAMES, feature_vector.flatten().tolist()))

        if self._model is not None:
            try:
                proba = self._model.predict_proba(feature_vector)[0][1]
                return MLScoreResult(score=float(proba), features=feature_dict, model_backend="xgboost")
            except Exception:
                # Defensive: fall through to heuristic if inference fails
                # at runtime for any reason (shape mismatch, etc.)
                pass

        return MLScoreResult(
            score=_heuristic_score(feature_vector),
            features=feature_dict,
            model_backend="heuristic_fallback",
        )


# Module-level singleton shared across the FastAPI app lifespan.
ml_scorer = MLRiskScorer()
