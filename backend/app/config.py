"""
app/config.py

Central configuration for the Rixor Sentinel backend. All tunable
thresholds, ensemble weights, and environment-driven settings live here so
that the rest of the codebase never hardcodes a "magic number".

Values can be overridden via environment variables (see .env.example),
which lets an analyst re-calibrate the policy without a code deployment —
mirroring the `/users/{userId}/policy/active` Firestore document described
in the system design.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from typing import Dict


def _env_float(name: str, default: float) -> float:
    raw = os.getenv(name)
    if raw is None or raw.strip() == "":
        return default
    try:
        return float(raw)
    except ValueError:
        return default


def _env_str(name: str, default: str) -> str:
    val = os.getenv(name)
    return val if val not in (None, "") else default


def _env_bool(name: str, default: bool) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


@dataclass
class EnsembleWeights:
    """Weights for the composite risk formula. Must sum to 1.0."""

    ml_weight: float = field(default_factory=lambda: _env_float("RIXOR_W_ML", 0.40))
    graph_weight: float = field(default_factory=lambda: _env_float("RIXOR_W_GRAPH", 0.35))
    velocity_weight: float = field(default_factory=lambda: _env_float("RIXOR_W_VELOCITY", 0.15))
    rules_weight: float = field(default_factory=lambda: _env_float("RIXOR_W_RULES", 0.10))

    def normalized(self) -> Dict[str, float]:
        total = self.ml_weight + self.graph_weight + self.velocity_weight + self.rules_weight
        if total <= 0:
            raise ValueError("Ensemble weights must sum to a positive number")
        return {
            "ml": self.ml_weight / total,
            "graph": self.graph_weight / total,
            "velocity": self.velocity_weight / total,
            "rules": self.rules_weight / total,
        }


@dataclass
class PolicyThresholds:
    """Risk-band cut points that drive defensive routing decisions."""

    monitor_threshold: float = field(default_factory=lambda: _env_float("RIXOR_T_MONITOR", 0.40))
    review_threshold: float = field(default_factory=lambda: _env_float("RIXOR_T_REVIEW", 0.55))
    hold_threshold: float = field(default_factory=lambda: _env_float("RIXOR_T_HOLD", 0.75))
    block_threshold: float = field(default_factory=lambda: _env_float("RIXOR_T_BLOCK", 0.88))


@dataclass
class RegulatoryConfig:
    """India-specific regulatory constants used by the deterministic rules engine."""

    kyc_ceiling_inr: float = field(default_factory=lambda: _env_float("RIXOR_KYC_CEILING", 50000.0))
    structuring_band_low_inr: float = field(default_factory=lambda: _env_float("RIXOR_STRUCTURING_LOW", 24000.0))
    structuring_band_high_inr: float = field(default_factory=lambda: _env_float("RIXOR_STRUCTURING_HIGH", 49999.0))
    disposable_email_domains: tuple = (
        "temp-inbox.com", "burner.cc", "mailinator.com", "guerrillamail.com",
        "10minutemail.com", "trashmail.com", "yopmail.com", "getnada.com",
    )


@dataclass
class VelocityWindows:
    """Rolling window sizes (seconds) used by the behavioral velocity engine."""

    short_window_seconds: int = 5 * 60          # 5 minutes
    medium_window_seconds: int = 60 * 60         # 1 hour
    long_window_seconds: int = 24 * 60 * 60      # 24 hours
    burst_window_seconds: int = 10 * 60          # 10-minute burst window (spec section 3)
    burst_count_threshold: int = 4               # >=4 events in burst window flags a velocity spike


@dataclass
class Settings:
    app_name: str = "Rixor Sentinel"
    environment: str = field(default_factory=lambda: _env_str("RIXOR_ENV", "development"))

    webhook_secret: str = field(default_factory=lambda: _env_str("RIXOR_WEBHOOK_SECRET", "change-me-in-production"))
    bearer_token: str = field(default_factory=lambda: _env_str("RIXOR_BEARER_TOKEN", "change-me-in-production"))

    recent_buffer_size: int = int(_env_float("RIXOR_BUFFER_SIZE", 100))
    idempotency_ttl_seconds: int = int(_env_float("RIXOR_IDEMPOTENCY_TTL", 24 * 60 * 60))

    firestore_project_id: str = field(default_factory=lambda: _env_str("RIXOR_FIRESTORE_PROJECT", ""))
    firestore_database_id: str = field(
        default_factory=lambda: _env_str(
            "RIXOR_FIRESTORE_DB",
            "ai-studio-rixor-f2b6aa9a-b425-413c-b36c-a500ffa9e594",
        )
    )
    firestore_enabled: bool = field(default_factory=lambda: _env_bool("RIXOR_FIRESTORE_ENABLED", False))

    model_path: str = field(
        default_factory=lambda: _env_str(
            "RIXOR_MODEL_PATH",
            os.path.join(os.path.dirname(__file__), "artifacts", "model.pkl"),
        )
    )

    weights: EnsembleWeights = field(default_factory=EnsembleWeights)
    thresholds: PolicyThresholds = field(default_factory=PolicyThresholds)
    regulatory: RegulatoryConfig = field(default_factory=RegulatoryConfig)
    velocity: VelocityWindows = field(default_factory=VelocityWindows)

    high_risk_merchant_categories: tuple = (
        "M-Gift", "M-Crypto", "M-Forex", "M-Wallet-Topup", "M-Electronics-HighValue",
    )
    high_risk_asn_flags: tuple = ("datacenter", "vpn", "tor", "proxy")


settings = Settings()
