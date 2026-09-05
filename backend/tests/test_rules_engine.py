"""
tests/test_rules_engine.py
"""

from app.rules_engine import evaluate_rules
from app.schemas import DeviceFlags, NetworkFlags


def test_no_rules_fire_on_clean_transaction():
    result = evaluate_rules(amount=1500.0, currency="INR", merchant_id="M-Grocery")
    assert result.score == 0.0
    assert result.evidence == []


def test_kyc_structuring_band_fires():
    result = evaluate_rules(amount=48000.0, currency="INR", merchant_id="M-Grocery")
    assert result.score > 0.0
    assert any(e.signal == "REG_KYC_STRUCTURING" for e in result.evidence)


def test_amount_outside_structuring_band_does_not_fire_kyc_rule():
    result = evaluate_rules(amount=5000.0, currency="INR", merchant_id="M-Grocery")
    assert all(e.signal != "REG_KYC_STRUCTURING" for e in result.evidence)


def test_disposable_email_fires():
    result = evaluate_rules(
        amount=1000.0, currency="INR", merchant_id="M-Grocery", customer_email="user@burner.cc"
    )
    assert any(e.signal == "REG_DISPOSABLE_EMAIL" for e in result.evidence)


def test_combined_signals_increase_score():
    single = evaluate_rules(amount=48000.0, currency="INR", merchant_id="M-Grocery")
    combined = evaluate_rules(
        amount=48000.0,
        currency="INR",
        merchant_id="M-Gift",
        customer_email="user@temp-inbox.com",
        network_flags=NetworkFlags(is_vpn=True),
        device_flags=DeviceFlags(headless_browser=True),
    )
    assert combined.score > single.score
    assert combined.score <= 1.0
