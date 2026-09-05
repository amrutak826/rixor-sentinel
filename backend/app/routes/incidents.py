"""
app/routes/incidents.py

Section 8: Incident Containment & Law Enforcement.

    GET  /api/rings                          - list all detected syndicates
    GET  /api/rings/{ring_id}                - transactions for one ring
    POST /api/rings/{ring_id}/dossier         - generate signed 1930 dossier
    POST /api/users/{user_id}/cases          - persist an analyst triage decision
    GET  /api/users/{user_id}/cases          - list an analyst's past decisions

Auth note: these are internal analyst-dashboard endpoints (not payment
gateway webhooks), so they're protected the same way as ingestion — via
X-Webhook-Secret / Bearer — rather than a full user-auth system, since the
spec doesn't define one. In a production deployment these would sit behind
your identity provider (Firebase Auth / OIDC) instead.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import verify_webhook_auth
from app.dossier import generate_dossier
from app.firestore_client import firestore_client
from app.graph_engine import graph_engine
from app.schemas import CaseDecision, DossierRequest, DossierResponse
from app.storage import recent_transactions_buffer

router = APIRouter(tags=["incidents"], dependencies=[Depends(verify_webhook_auth)])


@router.get("/api/rings")
async def list_rings() -> list[dict]:
    rings = graph_engine.all_rings()
    return [
        {
            "ring_id": r.ring_id,
            "customer_count": r.size,
            "asset_count": len(r.asset_ids),
            "max_asset_degree": r.max_asset_degree,
            "buffered_transaction_count": len(recent_transactions_buffer.all_for_ring(r.ring_id)),
        }
        for r in rings
    ]


@router.get("/api/rings/{ring_id}")
async def get_ring_transactions(ring_id: str) -> dict:
    transactions = recent_transactions_buffer.all_for_ring(ring_id)
    summary = graph_engine.ring_summary(ring_id)
    if summary is None and not transactions:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Ring '{ring_id}' not found")
    return {
        "ring_id": ring_id,
        "customer_ids": sorted(summary.customer_ids) if summary else [],
        "transactions": transactions,
    }


@router.post("/api/rings/{ring_id}/dossier", response_model=DossierResponse)
async def create_dossier(ring_id: str, request: DossierRequest) -> DossierResponse:
    if request.ring_id != ring_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ring_id in path and body must match",
        )
    transactions = recent_transactions_buffer.all_for_ring(ring_id)
    if not transactions:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No buffered transactions found for ring '{ring_id}'",
        )
    return generate_dossier(
        ring_id=ring_id,
        analyst_id=request.analyst_id,
        notes=request.notes,
        transactions=transactions,
    )


@router.post("/api/users/{user_id}/cases", response_model=CaseDecision)
async def save_case_decision(user_id: str, decision: CaseDecision) -> CaseDecision:
    if not decision.case_id:
        decision.case_id = str(uuid.uuid4())
    if decision.resolved_at is None:
        decision.resolved_at = datetime.now(timezone.utc)
    firestore_client.save_case_decision(user_id, decision)
    return decision


@router.get("/api/users/{user_id}/cases")
async def list_case_decisions(user_id: str) -> list[dict]:
    return firestore_client.list_case_decisions(user_id)
