"""
app/firestore_client.py

Cloud Firestore persistence layer, matching the collection schema:

    /users/{userId}                        -> analyst profile (name, email, role)
    /users/{userId}/cases/{caseId}          -> analyst triage decisions
    /users/{userId}/policy/active           -> per-analyst policy thresholds

Firestore access is entirely optional at runtime: if `google-cloud-firestore`
isn't installed, or credentials/`RIXOR_FIRESTORE_ENABLED` aren't configured,
`FirestoreClient` degrades to a no-op that logs a warning once and returns
empty/None results instead of raising — so the core risk-scoring pipeline
never goes down because of a persistence-layer outage. This mirrors the
architecture's hybrid "in-memory first, cloud second" design.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from app.config import settings
from app.schemas import CaseDecision, PolicyUpdate

logger = logging.getLogger("rixor.firestore")


class FirestoreClient:
    def __init__(self) -> None:
        self._enabled = False
        self._db = None
        self._warned = False

        if not settings.firestore_enabled:
            return

        try:
            from google.cloud import firestore  # type: ignore

            self._db = firestore.Client(
                project=settings.firestore_project_id or None,
                database=settings.firestore_database_id,
            )
            self._enabled = True
            logger.info(
                "Firestore connected (project=%s, database=%s)",
                settings.firestore_project_id or "<default>",
                settings.firestore_database_id,
            )
        except Exception as exc:  # pragma: no cover - environment dependent
            logger.warning("Firestore unavailable, falling back to no-op persistence: %s", exc)
            self._enabled = False
            self._db = None

    @property
    def enabled(self) -> bool:
        return self._enabled

    def _warn_once(self) -> None:
        if not self._warned:
            logger.warning(
                "Firestore is not enabled (RIXOR_FIRESTORE_ENABLED=false or client init failed); "
                "persistence calls are no-ops. Case decisions and policy overrides will not survive a restart."
            )
            self._warned = True

    # ------------------------------------------------------------------ #
    # /users/{userId}
    # ------------------------------------------------------------------ #

    def upsert_user(self, user_id: str, display_name: str, email: str, role: str = "analyst") -> bool:
        if not self._enabled:
            self._warn_once()
            return False
        doc_ref = self._db.collection("users").document(user_id)
        doc_ref.set(
            {
                "displayName": display_name,
                "email": email,
                "role": role,
                "updatedAt": datetime.now(timezone.utc),
            },
            merge=True,
        )
        return True

    # ------------------------------------------------------------------ #
    # /users/{userId}/cases/{caseId}
    # ------------------------------------------------------------------ #

    def save_case_decision(self, user_id: str, decision: CaseDecision) -> bool:
        if not self._enabled:
            self._warn_once()
            return False
        doc_ref = (
            self._db.collection("users")
            .document(user_id)
            .collection("cases")
            .document(decision.case_id)
        )
        doc_ref.set(
            {
                "transactionId": decision.transaction_id,
                "ringId": decision.ring_id,
                "decision": decision.decision.value,
                "rationale": decision.rationale,
                "analystId": decision.analyst_id,
                "resolvedAt": decision.resolved_at or datetime.now(timezone.utc),
            }
        )
        return True

    def list_case_decisions(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        if not self._enabled:
            self._warn_once()
            return []
        query = (
            self._db.collection("users")
            .document(user_id)
            .collection("cases")
            .order_by("resolvedAt", direction="DESCENDING")
            .limit(limit)
        )
        return [doc.to_dict() for doc in query.stream()]

    # ------------------------------------------------------------------ #
    # /users/{userId}/policy/active
    # ------------------------------------------------------------------ #

    def get_active_policy(self, user_id: str) -> Optional[Dict[str, Any]]:
        if not self._enabled:
            self._warn_once()
            return None
        doc_ref = (
            self._db.collection("users")
            .document(user_id)
            .collection("policy")
            .document("active")
        )
        snapshot = doc_ref.get()
        return snapshot.to_dict() if snapshot.exists else None

    def save_active_policy(self, user_id: str, policy: PolicyUpdate) -> bool:
        if not self._enabled:
            self._warn_once()
            return False
        doc_ref = (
            self._db.collection("users")
            .document(user_id)
            .collection("policy")
            .document("active")
        )
        payload = {k: v for k, v in policy.model_dump().items() if v is not None}
        payload["updatedAt"] = datetime.now(timezone.utc)
        doc_ref.set(payload, merge=True)
        return True


# Module-level singleton shared across the FastAPI app lifespan.
firestore_client = FirestoreClient()
