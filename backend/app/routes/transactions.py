"""
app/routes/transactions.py

Tier-1 → Tier-4 pipeline entrypoints:

    POST /api/transactions/ingest   - primary webhook receiver
    GET  /api/transactions/stream   - Server-Sent Events live pipeline
    GET  /api/transactions          - recent buffered transactions (<=100)
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse

from app.auth import verify_webhook_auth
from app.risk_engine import evaluate_transaction_risk
from app.routing import route_transaction
from app.schemas import IngestResponse, TransactionIngest, TransactionResult
from app.sse import broadcast_new_transaction, broadcaster, sse_event_generator
from app.storage import idempotency_store, recent_transactions_buffer

logger = logging.getLogger("rixor.transactions")

router = APIRouter(prefix="/api/transactions", tags=["transactions"])


@router.post(
    "/ingest",
    response_model=IngestResponse,
    dependencies=[Depends(verify_webhook_auth)],
    status_code=status.HTTP_200_OK,
)
async def ingest_transaction(tx: TransactionIngest) -> IngestResponse:
    """Primary webhook receiver from payment gateways (Razorpay / Cashfree /
    Stripe). Runs the full Tier-2/3/4 pipeline synchronously and returns the
    routing decision within the ingestion request/response cycle so the
    gateway can act on it immediately."""

    # --- Idempotency: O(1) duplicate-transaction rejection ----------------
    if idempotency_store.seen_before(tx.transaction_id):
        existing = recent_transactions_buffer.get(tx.transaction_id)
        if existing is not None:
            return IngestResponse(
                status="duplicate",
                message="Transaction already processed; returning cached result.",
                transaction=existing,
            )
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Duplicate transaction_id '{tx.transaction_id}' detected (idempotency check).",
        )

    # --- Tier 2/3: graph + ML + velocity + rules ensemble ------------------
    evaluation = evaluate_transaction_risk(tx)

    # --- Tier 4: defensive routing ------------------------------------------
    decision = route_transaction(evaluation.risk_score)

    result = TransactionResult(
        id=tx.transaction_id,
        customer_id=tx.customer_id,
        merchant_id=tx.merchant_id,
        amount=tx.amount,
        currency=tx.currency.value if hasattr(tx.currency, "value") else str(tx.currency),
        device_id=tx.device_id,
        ip_address=tx.ip_address,
        payment_instrument_id=tx.payment_instrument_id,
        timestamp=tx.timestamp,
        riskScore=evaluation.risk_score,
        riskBand=decision.band,
        action=decision.action,
        status=decision.status,
        ringId=evaluation.ring_id,
        evidence=evaluation.evidence,
        component_scores=evaluation.component_scores,
        processing_time_ms=evaluation.processing_time_ms,
    )

    recent_transactions_buffer.add(result)
    await broadcast_new_transaction(result)

    if decision.requires_dossier:
        logger.warning(
            "Transaction %s BLOCKED at risk=%.4f (ring=%s) — eligible for 1930 dossier generation.",
            tx.transaction_id, evaluation.risk_score, evaluation.ring_id,
        )

    return IngestResponse(
        status="success",
        message="Transaction ingested and risk evaluated successfully",
        transaction=result,
    )


@router.get("/stream")
async def stream_transactions() -> StreamingResponse:
    """Server-Sent Events endpoint. Connected clients receive every newly
    scored transaction in real time via `data: {...}\\n\\n` frames."""
    queue = await broadcaster.connect()
    return StreamingResponse(
        sse_event_generator(queue),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # disable nginx buffering for real-time delivery
        },
    )


@router.get("", response_model=list[TransactionResult])
async def list_recent_transactions(
    limit: int = Query(default=100, ge=1, le=100),
) -> list[TransactionResult]:
    """Returns recent buffered transactions from the in-memory cache
    (up to 100 items, newest first)."""
    return recent_transactions_buffer.recent(limit=limit)
