"""
ml/generate_synthetic_data.py

Generates a synthetic transaction dataset with embedded fraud "rings"
(syndicates that share devices, IPs, and payment instruments) alongside
ordinary legitimate customers — so the training pipeline has ground-truth
ring IDs to perform the Held-Out Ring Split described in spec section 3D.

Usage:
    python ml/generate_synthetic_data.py --out data/transactions.csv --rings 100 --legit 8000
"""

from __future__ import annotations

import argparse
import csv
import os
import random
import string
import uuid
from datetime import datetime, timedelta, timezone


def _random_id(prefix: str, k: int = 6) -> str:
    return f"{prefix}-{''.join(random.choices(string.ascii_uppercase + string.digits, k=k))}"


def _random_ip() -> str:
    return f"{random.randint(1,223)}.{random.randint(0,255)}.{random.randint(0,255)}.{random.randint(1,254)}"


HIGH_RISK_MERCHANTS = ["M-Gift", "M-Crypto", "M-Forex", "M-Wallet-Topup", "M-Electronics-HighValue"]
NORMAL_MERCHANTS = ["M-Grocery", "M-Fashion", "M-Electronics", "M-Travel", "M-Food", "M-Subscription"]
DISPOSABLE_DOMAINS = ["temp-inbox.com", "burner.cc", "mailinator.com", "guerrillamail.com"]
NORMAL_DOMAINS = ["gmail.com", "yahoo.com", "outlook.com", "icloud.com"]


def generate_ring(ring_index: int, base_time: datetime, size: int) -> list[dict]:
    """A ring shares 1-2 devices, 1-3 IPs, and 1-2 payment instruments
    across `size` distinct synthetic customer identities, transacting in a
    tight burst (classic Sybil/structuring signature)."""
    shared_devices = [_random_id("Device", 4) for _ in range(random.randint(1, 2))]
    shared_ips = [_random_ip() for _ in range(random.randint(1, 3))]
    shared_instruments = [_random_id("Instrument", 4) for _ in range(random.randint(1, 2))]
    ring_id = f"ring-{ring_index:03d}"

    rows = []
    for i in range(size):
        customer_id = f"C-{ring_id}-{i:03d}"
        n_tx = random.randint(1, 3)
        for _ in range(n_tx):
            ts = base_time + timedelta(minutes=random.randint(0, 240))
            amount = round(random.uniform(24000, 49999), 2)  # structuring band
            rows.append(
                {
                    "transaction_id": f"TX-{uuid.uuid4().hex[:10].upper()}",
                    "customer_id": customer_id,
                    "merchant_id": random.choice(HIGH_RISK_MERCHANTS),
                    "amount": amount,
                    "currency": "INR",
                    "device_id": random.choice(shared_devices),
                    "ip_address": random.choice(shared_ips),
                    "payment_instrument_id": random.choice(shared_instruments),
                    "timestamp": ts.isoformat(),
                    "customer_email": f"{customer_id.lower()}@{random.choice(DISPOSABLE_DOMAINS)}",
                    "device_headless": random.random() < 0.4,
                    "device_emulator": random.random() < 0.3,
                    "ring_id": ring_id,
                    "label_fraud": 1,
                }
            )
    return rows


def generate_legit_customer(index: int, base_time: datetime) -> list[dict]:
    """An ordinary customer with their own unique device/IP/card, shopping
    at normal hours with normal amounts."""
    customer_id = f"C-legit-{index:05d}"
    device_id = _random_id("Device", 6)
    ip_address = _random_ip()
    instrument_id = _random_id("Instrument", 6)
    n_tx = random.randint(1, 4)

    rows = []
    for _ in range(n_tx):
        hour_offset = random.gauss(mu=14, sigma=4)  # clustered around daytime
        ts = base_time + timedelta(hours=max(0, min(23, hour_offset)), minutes=random.randint(0, 59))
        amount = round(random.uniform(150, 15000), 2)
        rows.append(
            {
                "transaction_id": f"TX-{uuid.uuid4().hex[:10].upper()}",
                "customer_id": customer_id,
                "merchant_id": random.choice(NORMAL_MERCHANTS),
                "amount": amount,
                "currency": "INR",
                "device_id": device_id,
                "ip_address": ip_address,
                "payment_instrument_id": instrument_id,
                "timestamp": ts.isoformat(),
                "customer_email": f"{customer_id.lower()}@{random.choice(NORMAL_DOMAINS)}",
                "device_headless": False,
                "device_emulator": False,
                "ring_id": "",
                "label_fraud": 0,
            }
        )
    return rows


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate synthetic Rixor training data")
    parser.add_argument("--out", type=str, default="data/transactions.csv")
    parser.add_argument("--rings", type=int, default=100, help="Number of fraud rings to generate")
    parser.add_argument("--legit", type=int, default=8000, help="Number of legitimate customers to generate")
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    random.seed(args.seed)
    base_time = datetime(2026, 1, 1, tzinfo=timezone.utc)

    all_rows: list[dict] = []
    for ring_index in range(1, args.rings + 1):
        ring_size = random.randint(3, 20)
        all_rows.extend(generate_ring(ring_index, base_time, ring_size))

    for i in range(args.legit):
        all_rows.extend(generate_legit_customer(i, base_time))

    random.shuffle(all_rows)

    os.makedirs(os.path.dirname(args.out) or ".", exist_ok=True)
    fieldnames = list(all_rows[0].keys())
    with open(args.out, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(all_rows)

    fraud_count = sum(1 for r in all_rows if r["label_fraud"] == 1)
    print(f"Wrote {len(all_rows)} rows to {args.out} ({fraud_count} fraud / {len(all_rows) - fraud_count} legit)")
    print(f"Generated {args.rings} rings.")


if __name__ == "__main__":
    main()
