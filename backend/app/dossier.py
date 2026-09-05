"""
app/dossier.py

Tier-4: Incident Containment & Law Enforcement (1930 Cyber Cell Dossier).

When an analyst blocks an active syndicate, this module compiles a
court-admissible audit package:

    1. Event Evidence Chain  - every buffered transaction tied to the ring,
                                 in chronological order.
    2. Hardware & IP Proof    - colliding device fingerprints, shared IPs,
                                 and instrument recycling, pulled straight
                                 from the bipartite graph engine.
    3. Cryptographic Signing  - a SHA-256 hash computed over the canonical
                                 JSON serialization of the full evidence
                                 payload, so any later tampering with the
                                 exported file is detectable.
    4. Export Payload         - a structure formatted for direct upload to
                                 India's National Cyber Crime Reporting
                                 Portal (1930 Helpline) and acquiring-bank
                                 chargeback dispute desks.
"""

from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from typing import Any, Dict, List

from app.graph_engine import graph_engine
from app.schemas import DossierResponse, TransactionResult


def _canonical_json(payload: Dict[str, Any]) -> str:
    """Deterministic JSON serialization (sorted keys, fixed separators) so
    the SHA-256 hash is reproducible given the same logical content."""
    return json.dumps(payload, sort_keys=True, separators=(",", ":"), default=str)


def _build_evidence_chain(transactions: List[TransactionResult]) -> List[Dict[str, Any]]:
    chain = []
    for tx in sorted(transactions, key=lambda t: t.timestamp):
        chain.append(
            {
                "transaction_id": tx.id,
                "timestamp": tx.timestamp.isoformat(),
                "customer_id": tx.customer_id,
                "merchant_id": tx.merchant_id,
                "amount": tx.amount,
                "currency": tx.currency,
                "risk_score": tx.riskScore,
                "risk_band": tx.riskBand.value if hasattr(tx.riskBand, "value") else str(tx.riskBand),
                "action_taken": tx.action.value if hasattr(tx.action, "value") else str(tx.action),
                "evidence_signals": [e.signal for e in tx.evidence],
            }
        )
    return chain


def _build_hardware_ip_proof(transactions: List[TransactionResult]) -> Dict[str, Any]:
    device_ids = sorted({tx.device_id for tx in transactions})
    ip_addresses = sorted({tx.ip_address for tx in transactions})
    instrument_ids = sorted({tx.payment_instrument_id for tx in transactions})
    customer_ids = sorted({tx.customer_id for tx in transactions})

    device_collisions = {
        device_id: graph_engine.asset_degree_centrality("device", device_id)
        for device_id in device_ids
    }
    ip_collisions = {
        ip: graph_engine.asset_degree_centrality("ip", ip)
        for ip in ip_addresses
    }
    instrument_collisions = {
        instrument_id: graph_engine.asset_degree_centrality("instrument", instrument_id)
        for instrument_id in instrument_ids
    }

    return {
        "distinct_customer_identities": len(customer_ids),
        "customer_ids": customer_ids,
        "device_fingerprint_collisions": device_collisions,
        "ip_address_collisions": ip_collisions,
        "payment_instrument_collisions": instrument_collisions,
    }


def generate_dossier(
    ring_id: str,
    analyst_id: str,
    notes: str,
    transactions: List[TransactionResult],
) -> DossierResponse:
    """Builds and cryptographically signs the full 1930 dossier for a ring.

    `transactions` should be every buffered transaction whose `ringId`
    matches `ring_id` (the caller is responsible for filtering — see
    `app/routes/transactions.py` for how this is wired to the in-memory
    buffer)."""
    generated_at = datetime.now(timezone.utc)

    evidence_chain = _build_evidence_chain(transactions)
    hardware_ip_proof = _build_hardware_ip_proof(transactions)

    ring_summary = graph_engine.ring_summary(ring_id)
    total_fraud_amount = sum(tx.amount for tx in transactions if tx.riskScore >= 0.55)

    export_payload = {
        "case_reference": f"RIXOR-{ring_id}-{generated_at.strftime('%Y%m%d%H%M%S')}",
        "ring_id": ring_id,
        "generated_at": generated_at.isoformat(),
        "analyst_id": analyst_id,
        "notes": notes,
        "syndicate_size": ring_summary.size if ring_summary else len({tx.customer_id for tx in transactions}),
        "total_flagged_amount": round(total_fraud_amount, 2),
        "transaction_count": len(transactions),
        "evidence_chain": evidence_chain,
        "hardware_ip_proof": hardware_ip_proof,
        "destination": {
            "portal": "National Cyber Crime Reporting Portal (1930 Helpline)",
            "secondary_recipients": ["Acquiring bank chargeback / dispute desk"],
        },
    }

    signing_payload = {k: v for k, v in export_payload.items()}
    canonical = _canonical_json(signing_payload)
    sha256_hash = hashlib.sha256(canonical.encode("utf-8")).hexdigest()
    export_payload["sha256_hash"] = sha256_hash

    return DossierResponse(
        ring_id=ring_id,
        generated_at=generated_at,
        sha256_hash=sha256_hash,
        transaction_count=len(transactions),
        evidence_chain=evidence_chain,
        hardware_ip_proof=hardware_ip_proof,
        export_payload=export_payload,
    )
