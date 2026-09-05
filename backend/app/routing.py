"""
app/routing.py

Tier-4: Defensive Routing & Incident Containment.

Maps a continuous [0,1] risk score onto a discrete policy decision:

    risk < 0.40                      -> ALLOW
    0.40 <= risk < 0.55               -> MONITOR (soft-flag, still allowed)
    0.55 <= risk < 0.75               -> REVIEW / OTP step-up
    0.75 <= risk < 0.88               -> HOLD in 24h escrow
    risk >= 0.88                      -> BLOCK at gateway + 1930 dossier trigger

(The spec's four named bands leave the 0.40-0.55 range implicit; Rixor
adds an explicit MONITOR band there so every possible score maps to a
band and analysts can see soft-flags before they escalate to REVIEW.)
"""

from __future__ import annotations

from dataclasses import dataclass

from app.config import settings
from app.schemas import Action, RiskBand, TransactionStatus


@dataclass
class RoutingDecision:
    band: RiskBand
    action: Action
    status: TransactionStatus
    requires_dossier: bool


def route_transaction(risk_score: float) -> RoutingDecision:
    t = settings.thresholds

    if risk_score >= t.block_threshold:
        return RoutingDecision(
            band=RiskBand.CRITICAL,
            action=Action.BLOCK,
            status=TransactionStatus.BLOCKED,
            requires_dossier=True,
        )
    if risk_score >= t.hold_threshold:
        return RoutingDecision(
            band=RiskBand.HOLD,
            action=Action.HOLD_ESCROW,
            status=TransactionStatus.HELD,
            requires_dossier=False,
        )
    if risk_score >= t.review_threshold:
        return RoutingDecision(
            band=RiskBand.REVIEW,
            action=Action.REVIEW_OTP,
            status=TransactionStatus.PENDING_REVIEW,
            requires_dossier=False,
        )
    if risk_score >= t.monitor_threshold:
        return RoutingDecision(
            band=RiskBand.MONITOR,
            action=Action.ALLOW,
            status=TransactionStatus.ALLOWED,
            requires_dossier=False,
        )
    return RoutingDecision(
        band=RiskBand.LOW,
        action=Action.ALLOW,
        status=TransactionStatus.ALLOWED,
        requires_dossier=False,
    )
