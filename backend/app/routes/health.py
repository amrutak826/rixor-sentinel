"""
app/routes/health.py

GET /api/health — service liveness probe (<2ms target latency).
"""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter

from app import __version__
from app.graph_engine import graph_engine
from app.schemas import HealthResponse
from app.storage import recent_transactions_buffer

router = APIRouter(tags=["health"])


@router.get("/api/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    return HealthResponse(
        status="ok",
        service="Rixor Sentinel",
        version=__version__,
        timestamp=datetime.now(timezone.utc),
        graph_nodes=graph_engine.node_count(),
        graph_edges=graph_engine.edge_count(),
        buffered_transactions=recent_transactions_buffer.size(),
    )
