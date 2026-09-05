"""
app/risk_engine.py

Tier-3: Multi-Layer Ensemble Risk Scorer.

Composite formula (weights configurable via app/config.py, default matches
the spec):

    risk_score = 0.40 * ML_score
               + 0.35 * Graph_score
               + 0.15 * Velocity_score
               + 0.10 * Rules_score

This module is the single place where all four signal families are pulled
together into one `evaluate_transaction_risk()` call, producing both the
final score and a structured evidence trail an analyst (or the 1930
dossier generator) can read without reverse-engineering the math.
"""

from __future__ import annotations

import time
from dataclasses import dataclass
from datetime import datetime
from typing import Dict, List, Optional

from app.config import settings
from app.graph_engine import graph_engine
from app.ml_scorer import ml_scorer
from app.rules_engine import evaluate_rules
from app.schemas import DeviceFlags, EvidenceSignal, NetworkFlags, TransactionIngest
from app.velocity import velocity_tracker


@dataclass
class RiskEvaluation:
    risk_score: float
    component_scores: Dict[str, float]
    evidence: List[EvidenceSignal]
    ring_id: Optional[str]
    processing_time_ms: float


def _graph_evidence(
    component_scores: Dict[str, float],
    ring_id: Optional[str],
    device_id: str,
    payment_instrument_id: str,
) -> List[EvidenceSignal]:
    evidence: List[EvidenceSignal] = []
    device_score = component_scores.get("device_sharing", 0.0)
    instrument_score = component_scores.get("instrument_sharing", 0.0)
    ip_score = component_scores.get("ip_sharing", 0.0)

    if device_score > 0.25:
        degree = graph_engine.asset_degree_centrality("device", device_id)
        evidence.append(
            EvidenceSignal(
                signal="GRAPH_HARDWARE_SYBIL",
                severity="critical" if device_score > 0.6 else "high",
                explanation=(
                    f"Device fingerprint {device_id} is linked to {degree} distinct customer "
                    f"identities" + (f" in ring {ring_id}." if ring_id else ".")
                ),
                weight_contribution=round(device_score, 4),
            )
        )
    if instrument_score > 0.25:
        degree = graph_engine.asset_degree_centrality("instrument", payment_instrument_id)
        evidence.append(
            EvidenceSignal(
                signal="GRAPH_INSTRUMENT_RECYCLING",
                severity="critical" if instrument_score > 0.6 else "high",
                explanation=(
                    f"Payment instrument {payment_instrument_id} has been used by {degree} "
                    f"distinct customer identities, consistent with prepaid card recycling."
                ),
                weight_contribution=round(instrument_score, 4),
            )
        )
    if ip_score > 0.35:
        evidence.append(
            EvidenceSignal(
                signal="GRAPH_IP_CLUSTERING",
                severity="warning",
                explanation="Originating IP is shared across an unusually large number of customer identities.",
                weight_contribution=round(ip_score, 4),
            )
        )
    return evidence


def _velocity_evidence(velocity_score: float, breakdown: Dict[str, Dict[str, int]]) -> List[EvidenceSignal]:
    if velocity_score <= 0.15:
        return []
    hottest_key, hottest_counts = max(
        breakdown.items(), key=lambda kv: kv[1].get("window_burst_10m", 0)
    )
    burst = hottest_counts.get("window_burst_10m", 0)
    return [
        EvidenceSignal(
            signal="VELOCITY_BURST",
            severity="critical" if velocity_score > 0.6 else "warning",
            explanation=f"{burst} transactions detected on the same {hottest_key} within a 10-minute window.",
            weight_contribution=round(velocity_score, 4),
        )
    ]


def evaluate_transaction_risk(tx: TransactionIngest) -> RiskEvaluation:
    start = time.perf_counter()
    weights = settings.weights.normalized()

    # --- Tier 2: Graph structural score ----------------------------------
    graph_score, graph_components, ring_id = graph_engine.structural_risk_score(
        customer_id=tx.customer_id,
        device_id=tx.device_id,
        ip_address=tx.ip_address,
        payment_instrument_id=tx.payment_instrument_id,
    )

    # --- Tier 3a: Behavioral velocity score --------------------------------
    velocity_score, velocity_breakdown = velocity_tracker.entity_velocity_score(
        device_id=tx.device_id,
        ip_address=tx.ip_address,
        payment_instrument_id=tx.payment_instrument_id,
    )
    velocity_counts_for_ml = velocity_breakdown["device"]

    # --- Tier 3b: Supervised ML score --------------------------------------
    ml_result = ml_scorer.score(
        amount=tx.amount,
        velocity_counts=velocity_counts_for_ml,
        device_flags=tx.device_flags,
        timestamp=tx.timestamp,
        merchant_id=tx.merchant_id,
    )

    # --- Tier 3c: Deterministic regulatory rules ---------------------------
    rules_result = evaluate_rules(
        amount=tx.amount,
        currency=tx.currency.value if hasattr(tx.currency, "value") else str(tx.currency),
        merchant_id=tx.merchant_id,
        customer_email=tx.customer_email,
        network_flags=tx.network_flags,
        device_flags=tx.device_flags,
    )

    # --- Composite ensemble --------------------------------------------------
    composite = (
        weights["ml"] * ml_result.score
        + weights["graph"] * graph_score
        + weights["velocity"] * velocity_score
        + weights["rules"] * rules_result.score
    )
    composite = max(0.0, min(1.0, composite))

    evidence: List[EvidenceSignal] = []
    evidence.extend(_graph_evidence(graph_components, ring_id, tx.device_id, tx.payment_instrument_id))
    evidence.extend(_velocity_evidence(velocity_score, velocity_breakdown))
    evidence.extend(rules_result.evidence)
    if ml_result.score > 0.5:
        evidence.append(
            EvidenceSignal(
                signal="ML_BEHAVIORAL_ANOMALY",
                severity="critical" if ml_result.score > 0.8 else "warning",
                explanation=(
                    f"Supervised model ({ml_result.model_backend}) flagged this transaction's "
                    f"behavioral profile with probability {ml_result.score:.2f}."
                ),
                weight_contribution=round(ml_result.score, 4),
            )
        )

    # Now that the transaction has been scored, register its assets in the
    # graph so subsequent transactions see this one as prior history.
    graph_engine.ingest_transaction(
        customer_id=tx.customer_id,
        device_id=tx.device_id,
        ip_address=tx.ip_address,
        payment_instrument_id=tx.payment_instrument_id,
        drop_address=tx.drop_address,
    )
    # Ring ID may change after ingestion (this transaction could be the one
    # that merges two previously-separate components), so resolve it again.
    ring_id = graph_engine.ring_id_for_customer(tx.customer_id) or ring_id

    component_scores = {
        "ml": round(ml_result.score, 4),
        "graph": round(graph_score, 4),
        "velocity": round(velocity_score, 4),
        "rules": round(rules_result.score, 4),
        "ml_backend": ml_result.model_backend,
    }

    elapsed_ms = (time.perf_counter() - start) * 1000.0
    return RiskEvaluation(
        risk_score=round(composite, 4),
        component_scores=component_scores,
        evidence=evidence,
        ring_id=ring_id,
        processing_time_ms=round(elapsed_ms, 3),
    )
