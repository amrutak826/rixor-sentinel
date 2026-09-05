"""
app/rules_engine.py

Tier-3 (10% weight): Deterministic Regulatory Rules.

Unlike the ML and graph engines, this layer encodes *known, auditable*
regulatory logic that must never depend on a trained model — a compliance
officer needs to be able to point at a rule and say exactly why it fired.

Covers:
    - RBI sub-₹50,000 KYC structuring: amounts clustered just under the
      threshold (₹24,000–₹49,999) are a classic smurfing signature.
    - Disposable / burner email domains on the customer profile.
    - High-risk merchant category codes (gift cards, crypto on-ramps,
      wallet top-ups — common fraud cash-out rails).
    - Known high-risk network flags (datacenter / VPN / Tor / proxy ASN).
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import List, Optional

from app.config import settings
from app.schemas import DeviceFlags, EvidenceSignal, NetworkFlags


@dataclass
class RulesResult:
    score: float
    evidence: List[EvidenceSignal]


def _domain_of(email: Optional[str]) -> Optional[str]:
    if not email or "@" not in email:
        return None
    return email.rsplit("@", 1)[-1].strip().lower()


def evaluate_rules(
    amount: float,
    currency: str,
    merchant_id: str,
    customer_email: Optional[str] = None,
    network_flags: Optional[NetworkFlags] = None,
    device_flags: Optional[DeviceFlags] = None,
) -> RulesResult:
    """Runs every deterministic regulatory rule and returns a composite
    [0, 1] score plus the human-readable evidence trail."""
    cfg = settings.regulatory
    evidence: List[EvidenceSignal] = []
    fired_weights: List[float] = []

    # --- Rule 1: KYC sub-threshold structuring (INR only) ---------------
    if currency == "INR" and cfg.structuring_band_low_inr <= amount <= cfg.structuring_band_high_inr:
        evidence.append(
            EvidenceSignal(
                signal="REG_KYC_STRUCTURING",
                severity="critical",
                explanation=(
                    f"Amount ₹{amount:,.2f} falls within the ₹{cfg.structuring_band_low_inr:,.0f}"
                    f"–₹{cfg.structuring_band_high_inr:,.0f} structuring band, just under the "
                    f"RBI ₹{cfg.kyc_ceiling_inr:,.0f} KYC threshold."
                ),
                weight_contribution=0.55,
            )
        )
        fired_weights.append(0.55)

    # --- Rule 2: Disposable / burner email domain ------------------------
    domain = _domain_of(customer_email)
    if domain and domain in cfg.disposable_email_domains:
        evidence.append(
            EvidenceSignal(
                signal="REG_DISPOSABLE_EMAIL",
                severity="high",
                explanation=f"Customer email uses disposable domain '{domain}', consistent with synthetic identity creation.",
                weight_contribution=0.25,
            )
        )
        fired_weights.append(0.25)

    # --- Rule 3: High-risk merchant category -----------------------------
    if merchant_id in settings.high_risk_merchant_categories:
        evidence.append(
            EvidenceSignal(
                signal="REG_HIGH_RISK_MERCHANT",
                severity="warning",
                explanation=f"Merchant '{merchant_id}' is in a high cash-out-risk category (gift cards / crypto / wallet top-up).",
                weight_contribution=0.15,
            )
        )
        fired_weights.append(0.15)

    # --- Rule 4: Network-level anonymization flags -----------------------
    if network_flags and (network_flags.is_datacenter or network_flags.is_vpn
                           or network_flags.is_tor or network_flags.is_proxy):
        active_flags = [
            name for name, val in (
                ("datacenter", network_flags.is_datacenter),
                ("VPN", network_flags.is_vpn),
                ("Tor", network_flags.is_tor),
                ("proxy", network_flags.is_proxy),
            ) if val
        ]
        evidence.append(
            EvidenceSignal(
                signal="REG_ANONYMIZED_NETWORK",
                severity="high",
                explanation=f"Originating IP flagged as {', '.join(active_flags)}.",
                weight_contribution=0.30,
            )
        )
        fired_weights.append(0.30)

    # --- Rule 5: Device environment red flags ----------------------------
    if device_flags and (device_flags.headless_browser or device_flags.emulator_container
                          or device_flags.android_bluestacks or device_flags.linux_scraper_script):
        active_flags = [
            name for name, val in (
                ("headless browser", device_flags.headless_browser),
                ("emulator container", device_flags.emulator_container),
                ("Android BlueStacks", device_flags.android_bluestacks),
                ("Linux scraper script", device_flags.linux_scraper_script),
            ) if val
        ]
        evidence.append(
            EvidenceSignal(
                signal="REG_AUTOMATED_ENVIRONMENT",
                severity="critical",
                explanation=f"Device environment indicates automation: {', '.join(active_flags)}.",
                weight_contribution=0.40,
            )
        )
        fired_weights.append(0.40)

    if not fired_weights:
        return RulesResult(score=0.0, evidence=[])

    # Combine fired rule weights so multiple simultaneous red flags push
    # the score higher, but it still saturates at 1.0 (noisy-OR style).
    composite = 1.0
    for w in fired_weights:
        composite *= (1.0 - w)
    composite = 1.0 - composite

    return RulesResult(score=round(min(1.0, composite), 4), evidence=evidence)
