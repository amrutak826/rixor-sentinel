"""
tests/test_risk_engine.py

End-to-end tests of the ensemble risk engine and routing logic using the
module-level singletons (graph_engine, velocity_tracker) — each test uses
distinct customer/device/IP identifiers to avoid cross-test interference
since these are shared, stateful singletons (mirroring production
behavior where the graph accumulates across the process lifetime).
"""

from datetime import datetime, timezone

from app.risk_engine import evaluate_transaction_risk
from app.routing import route_transaction
from app.schemas import Currency, TransactionIngest


def _make_tx(**overrides) -> TransactionIngest:
    defaults = dict(
        transaction_id="TX-TEST-0001",
        customer_id="C-TEST-1",
        merchant_id="M-Grocery",
        amount=1500.0,
        currency=Currency.INR,
        device_id="Device-TEST-1",
        ip_address="10.0.0.1",
        payment_instrument_id="Instrument-TEST-1",
        timestamp=datetime.now(timezone.utc),
    )
    defaults.update(overrides)
    return TransactionIngest(**defaults)


def test_clean_transaction_scores_low():
    tx = _make_tx(
        transaction_id="TX-CLEAN-0001",
        customer_id="C-CLEAN-1",
        device_id="Device-CLEAN-1",
        ip_address="10.0.1.1",
        payment_instrument_id="Instrument-CLEAN-1",
        amount=1200.0,
        merchant_id="M-Grocery",
    )
    evaluation = evaluate_transaction_risk(tx)
    assert 0.0 <= evaluation.risk_score <= 1.0
    decision = route_transaction(evaluation.risk_score)
    assert decision.action.value == "ALLOW"


def test_sybil_ring_scores_higher_than_clean():
    shared_device = "Device-SHARED-RING"
    shared_instrument = "Instrument-SHARED-RING"

    tx1 = _make_tx(
        transaction_id="TX-RING-0001",
        customer_id="C-RING-1",
        device_id=shared_device,
        ip_address="10.0.2.1",
        payment_instrument_id=shared_instrument,
        amount=45000.0,
        merchant_id="M-Gift",
    )
    evaluate_transaction_risk(tx1)

    tx2 = _make_tx(
        transaction_id="TX-RING-0002",
        customer_id="C-RING-2",
        device_id=shared_device,
        ip_address="10.0.2.2",
        payment_instrument_id=shared_instrument,
        amount=46000.0,
        merchant_id="M-Gift",
    )
    ring_evaluation = evaluate_transaction_risk(tx2)

    clean_tx = _make_tx(
        transaction_id="TX-RING-CTRL-0001",
        customer_id="C-RING-CTRL-1",
        device_id="Device-CTRL-1",
        ip_address="10.0.2.3",
        payment_instrument_id="Instrument-CTRL-1",
        amount=1200.0,
        merchant_id="M-Grocery",
    )
    clean_evaluation = evaluate_transaction_risk(clean_tx)

    assert ring_evaluation.risk_score > clean_evaluation.risk_score
    assert ring_evaluation.ring_id is not None


def test_routing_thresholds_are_monotonic():
    assert route_transaction(0.10).action.value == "ALLOW"
    assert route_transaction(0.45).action.value == "ALLOW"      # MONITOR still allows
    assert route_transaction(0.60).action.value == "REVIEW_OTP"
    assert route_transaction(0.80).action.value == "HOLD_ESCROW"
    assert route_transaction(0.95).action.value == "BLOCK"
