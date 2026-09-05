"""
app/routes/policy.py

    GET  /api/users/{user_id}/policy   - fetch this analyst's active policy
    POST /api/users/{user_id}/policy   - update thresholds / ensemble weights

Persists to /users/{userId}/policy/active in Firestore when enabled, and
also applies the update to the live in-process `settings` object so the
running risk engine picks up the new thresholds immediately — matching
the spec's "Stores customized policy thresholds" description.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.auth import verify_webhook_auth
from app.config import settings
from app.firestore_client import firestore_client
from app.schemas import PolicyUpdate

router = APIRouter(prefix="/api/users/{user_id}/policy", tags=["policy"], dependencies=[Depends(verify_webhook_auth)])


@router.get("")
async def get_policy(user_id: str) -> dict:
    stored = firestore_client.get_active_policy(user_id)
    live = {
        "review_threshold": settings.thresholds.review_threshold,
        "hold_threshold": settings.thresholds.hold_threshold,
        "block_threshold": settings.thresholds.block_threshold,
        "monitor_threshold": settings.thresholds.monitor_threshold,
        "ml_weight": settings.weights.ml_weight,
        "graph_weight": settings.weights.graph_weight,
        "velocity_weight": settings.weights.velocity_weight,
        "rules_weight": settings.weights.rules_weight,
    }
    return {"live_policy": live, "stored_policy": stored}


@router.post("")
async def update_policy(user_id: str, update: PolicyUpdate) -> dict:
    if update.review_threshold is not None:
        settings.thresholds.review_threshold = update.review_threshold
    if update.hold_threshold is not None:
        settings.thresholds.hold_threshold = update.hold_threshold
    if update.block_threshold is not None:
        settings.thresholds.block_threshold = update.block_threshold
    if update.ml_weight is not None:
        settings.weights.ml_weight = update.ml_weight
    if update.graph_weight is not None:
        settings.weights.graph_weight = update.graph_weight
    if update.velocity_weight is not None:
        settings.weights.velocity_weight = update.velocity_weight
    if update.rules_weight is not None:
        settings.weights.rules_weight = update.rules_weight

    firestore_client.save_active_policy(user_id, update)
    return {"status": "updated", "user_id": user_id}
