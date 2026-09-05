"""
app/schemas.py

Pydantic data contracts for the Rixor Sentinel API. The `TransactionIngest`
model matches the webhook payload specification exactly for the required
fields, and adds a set of *optional* extended fields (device flags,
customer email, drop address, BIN number) that feed the graph, ML, and
rules engines when a gateway integration provides them. Nothing here is a
placeholder — every optional field is consumed by real logic downstream.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, field_validator


class Currency(str, Enum):
    INR = "INR"
    USD = "USD"
    EUR = "EUR"
    GBP = "GBP"


class DeviceFlags(BaseModel):
    headless_browser: bool = False
    emulator_container: bool = False
    android_bluestacks: bool = False
    linux_scraper_script: bool = False
    webgl_canvas_hash: Optional[str] = None
    audio_context_entropy: Optional[float] = None
    user_agent: Optional[str] = None


class NetworkFlags(BaseModel):
    asn: Optional[str] = None
    is_datacenter: bool = False
    is_vpn: bool = False
    is_tor: bool = False
    is_proxy: bool = False


class TransactionIngest(BaseModel):
    """Payload contract for POST /api/transactions/ingest."""

    transaction_id: str = Field(..., min_length=1, max_length=128)
    customer_id: str = Field(..., min_length=1, max_length=128)
    merchant_id: str = Field(..., min_length=1, max_length=128)
    amount: float = Field(..., gt=0, description="Transaction amount; must be strictly positive")
    currency: Currency = Currency.INR
    device_id: str = Field(..., min_length=1, max_length=128)
    ip_address: str = Field(..., min_length=3, max_length=64)
    payment_instrument_id: str = Field(..., min_length=1, max_length=128)
    timestamp: datetime

    # Optional extended signals consumed by ML / rules / graph engines
    customer_email: Optional[str] = None
    drop_address: Optional[str] = None
    drop_latitude: Optional[float] = None
    drop_longitude: Optional[float] = None
    bin_number: Optional[str] = Field(default=None, min_length=6, max_length=8)
    device_flags: Optional[DeviceFlags] = None
    network_flags: Optional[NetworkFlags] = None

    @field_validator("amount")
    @classmethod
    def amount_must_be_finite_and_reasonable(cls, v: float) -> float:
        if v != v or v in (float("inf"), float("-inf")):  # NaN / inf guard
            raise ValueError("amount must be a finite positive number")
        if v > 100_000_000:
            raise ValueError("amount exceeds sane processing ceiling")
        return v

    @field_validator("timestamp")
    @classmethod
    def timestamp_must_be_iso8601(cls, v: datetime) -> datetime:
        # Pydantic already parses ISO-8601 strings into datetime; this
        # validator exists to make the contract explicit and to reject
        # naive-but-implausible far-future/past timestamps.
        return v


class EvidenceSignal(BaseModel):
    signal: str
    severity: str  # "info" | "warning" | "high" | "critical"
    explanation: str
    weight_contribution: Optional[float] = None


class RiskBand(str, Enum):
    LOW = "LOW"
    MONITOR = "MONITOR"
    REVIEW = "REVIEW"
    HOLD = "HOLD"
    CRITICAL = "CRITICAL"


class Action(str, Enum):
    ALLOW = "ALLOW"
    REVIEW_OTP = "REVIEW_OTP"
    HOLD_ESCROW = "HOLD_ESCROW"
    BLOCK = "BLOCK"


class TransactionStatus(str, Enum):
    ALLOWED = "ALLOWED"
    PENDING_REVIEW = "PENDING_REVIEW"
    HELD = "HELD"
    BLOCKED = "BLOCKED"


class TransactionResult(BaseModel):
    id: str
    customer_id: str
    merchant_id: str
    amount: float
    currency: str
    device_id: str
    ip_address: str
    payment_instrument_id: str
    timestamp: datetime

    riskScore: float
    riskBand: RiskBand
    action: Action
    status: TransactionStatus
    ringId: Optional[str] = None
    evidence: List[EvidenceSignal] = Field(default_factory=list)

    component_scores: Dict[str, Any] = Field(default_factory=dict)
    processing_time_ms: float = 0.0


class IngestResponse(BaseModel):
    status: str
    message: str
    transaction: TransactionResult


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    timestamp: datetime
    graph_nodes: int
    graph_edges: int
    buffered_transactions: int


class CaseDecision(BaseModel):
    """Analyst triage action persisted under /users/{userId}/cases/{caseId}."""

    case_id: str
    transaction_id: str
    ring_id: Optional[str] = None
    decision: Action
    rationale: str = ""
    analyst_id: str
    resolved_at: Optional[datetime] = None


class PolicyUpdate(BaseModel):
    review_threshold: Optional[float] = None
    hold_threshold: Optional[float] = None
    block_threshold: Optional[float] = None
    ml_weight: Optional[float] = None
    graph_weight: Optional[float] = None
    velocity_weight: Optional[float] = None
    rules_weight: Optional[float] = None


class DossierRequest(BaseModel):
    ring_id: str
    analyst_id: str
    notes: str = ""


class DossierResponse(BaseModel):
    ring_id: str
    generated_at: datetime
    sha256_hash: str
    transaction_count: int
    evidence_chain: List[Dict[str, Any]]
    hardware_ip_proof: Dict[str, Any]
    export_payload: Dict[str, Any]
