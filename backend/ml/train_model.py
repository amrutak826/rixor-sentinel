"""
ml/train_model.py

Trains the Tier-3 supervised model (XGBoost gradient-boosted trees) on the
synthetic dataset produced by `generate_synthetic_data.py`, using the
Held-Out Ring Evaluation Methodology described in spec section 3D:

    "Traditional random row splitting (80/20 train/test) causes
     catastrophic data leakage in fraud detection because transactions
     from the same syndicate appear in both sets."

Instead, this script:
    1. Identifies every distinct ring_id in the dataset.
    2. Reserves the LAST 15% of rings (by index) entirely for the test
       set — no transaction from a held-out ring is ever seen in training.
    3. All legitimate (non-ring) transactions are split 80/20 normally,
       since they have no syndicate membership to leak across.
    4. Trains an XGBoost classifier on the same 10-feature vector used at
       inference time (app/ml_scorer.py::build_feature_vector).
    5. Reports precision / recall / F1 on the held-out rings, and saves
       the trained model to app/artifacts/model.pkl via joblib so
       `app/ml_scorer.py` picks it up automatically on next process start
       (or immediately via MLRiskScorer.reload()).

Usage:
    python ml/generate_synthetic_data.py --out data/transactions.csv
    python ml/train_model.py --data data/transactions.csv --out ../app/artifacts/model.pkl
"""

from __future__ import annotations

import argparse
import math
import os
from datetime import datetime, timezone

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import f1_score, precision_score, recall_score
from xgboost import XGBClassifier

FEATURE_NAMES = [
    "amount_log_inr",
    "velocity_5m",
    "velocity_1h",
    "velocity_24h",
    "device_headless",
    "device_emulator",
    "device_bluestacks",
    "device_scraper",
    "time_of_day_entropy",
    "merchant_risk_index",
]

HIGH_RISK_MERCHANTS = {"M-Gift", "M-Crypto", "M-Forex", "M-Wallet-Topup", "M-Electronics-HighValue"}


def _time_of_day_entropy(ts: pd.Timestamp) -> float:
    hour = ts.hour + ts.minute / 60.0
    center, width = 3.0, 2.5
    return float(math.exp(-0.5 * ((hour - center) / width) ** 2))


def _engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """Reconstructs the same 10-dim feature vector used at inference time.
    Velocity counts are approximated here from the ring/device grouping
    since the synthetic generator doesn't emit a live rolling-window
    stream — this is standard practice for offline training data."""
    df = df.copy()
    df["timestamp"] = pd.to_datetime(df["timestamp"], utc=True)

    df["amount_log_inr"] = np.log1p(df["amount"].clip(lower=0))

    device_counts = df.groupby("device_id")["transaction_id"].transform("count")
    df["velocity_5m"] = (device_counts / 3).clip(upper=15)
    df["velocity_1h"] = (device_counts / 1.5).clip(upper=40)
    df["velocity_24h"] = device_counts.clip(upper=120)

    df["device_headless"] = df["device_headless"].astype(float)
    df["device_emulator"] = df["device_emulator"].astype(float)
    df["device_bluestacks"] = 0.0
    df["device_scraper"] = 0.0

    df["time_of_day_entropy"] = df["timestamp"].apply(_time_of_day_entropy)
    df["merchant_risk_index"] = df["merchant_id"].apply(lambda m: 1.0 if m in HIGH_RISK_MERCHANTS else 0.15)

    return df


def _held_out_ring_split(df: pd.DataFrame, holdout_fraction: float = 0.15, seed: int = 42):
    ring_ids = sorted(df.loc[df["ring_id"] != "", "ring_id"].unique())
    n_holdout = max(1, int(len(ring_ids) * holdout_fraction))
    rng = np.random.RandomState(seed)
    holdout_rings = set(rng.choice(ring_ids, size=n_holdout, replace=False))

    is_holdout_ring = df["ring_id"].isin(holdout_rings)
    ring_train = df[(df["ring_id"] != "") & (~is_holdout_ring)]
    ring_test = df[is_holdout_ring]

    legit = df[df["ring_id"] == ""]
    legit_shuffled = legit.sample(frac=1.0, random_state=seed)
    split_point = int(len(legit_shuffled) * 0.8)
    legit_train = legit_shuffled.iloc[:split_point]
    legit_test = legit_shuffled.iloc[split_point:]

    train_df = pd.concat([ring_train, legit_train], ignore_index=True)
    test_df = pd.concat([ring_test, legit_test], ignore_index=True)
    return train_df, test_df, holdout_rings


def main() -> None:
    parser = argparse.ArgumentParser(description="Train the Rixor XGBoost risk model")
    parser.add_argument("--data", type=str, default="data/transactions.csv")
    parser.add_argument("--out", type=str, default="../app/artifacts/model.pkl")
    parser.add_argument("--holdout-fraction", type=float, default=0.15)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    print(f"Loading dataset from {args.data} ...")
    df = pd.read_csv(args.data)
    df["ring_id"] = df["ring_id"].fillna("").astype(str)

    print("Engineering features ...")
    df = _engineer_features(df)

    print(f"Performing held-out ring split (holdout_fraction={args.holdout_fraction}) ...")
    train_df, test_df, holdout_rings = _held_out_ring_split(df, args.holdout_fraction, args.seed)
    print(f"Held out {len(holdout_rings)} rings for testing: {sorted(holdout_rings)}")
    print(f"Train rows: {len(train_df)} | Test rows: {len(test_df)}")

    X_train = train_df[FEATURE_NAMES].values
    y_train = train_df["label_fraud"].values
    X_test = test_df[FEATURE_NAMES].values
    y_test = test_df["label_fraud"].values

    print("Training XGBoost classifier ...")
    model = XGBClassifier(
        n_estimators=300,
        max_depth=5,
        learning_rate=0.05,
        subsample=0.85,
        colsample_bytree=0.85,
        eval_metric="logloss",
        random_state=args.seed,
        n_jobs=-1,
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    precision = precision_score(y_test, y_pred, zero_division=0)
    recall = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)

    print("\n=== Held-Out Ring Evaluation Results ===")
    print(f"Precision: {precision * 100:.1f}%")
    print(f"Recall:    {recall * 100:.1f}%")
    print(f"F1 Score:  {f1 * 100:.1f}%")

    out_path = os.path.abspath(args.out)
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    joblib.dump(model, out_path)
    print(f"\nSaved trained model to {out_path}")
    print(f"Trained at {datetime.now(timezone.utc).isoformat()}")


if __name__ == "__main__":
    main()
