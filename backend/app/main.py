"""
app/main.py

Rixor Sentinel — FastAPI application entrypoint.

Run locally with:
    uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

All four architecture tiers are wired here:
    Tier 1  ingestion & auth        -> app.auth, app.routes.transactions
    Tier 2  graph engine             -> app.graph_engine
    Tier 3  ensemble risk scorer      -> app.risk_engine (ml_scorer, rules_engine, velocity)
    Tier 4  defensive routing         -> app.routing, app.dossier
"""

from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import __version__
from app.routes import health, incidents, policy, transactions

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

app = FastAPI(
    title="Rixor Sentinel",
    description=(
        "Real-time graph intelligence platform for detecting and dismantling "
        "Sybil attacks and coordinated financial fraud syndicates."
    ),
    version=__version__,
)

# CORS: the React analyst dashboard runs on a separate origin during
# development. Tighten `allow_origins` to your deployed dashboard's exact
# origin(s) in production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(transactions.router)
app.include_router(incidents.router)
app.include_router(policy.router)


@app.get("/", tags=["root"])
async def root() -> dict:
    return {
        "service": "Rixor Sentinel",
        "version": __version__,
        "docs": "/docs",
        "health": "/api/health",
    }
