# Rixor Sentinel — Architecture

```text
Razorpay / Payment Webhook
          │
          ▼
┌──────────────────────────┐
│ FastAPI Ingestion Layer  │
│ auth + validation        │
│ idempotency              │
└────────────┬─────────────┘
             ▼
┌──────────────────────────┐
│ Graph Intelligence       │
│ customer ↔ device/IP/    │
│ instrument relationships │
└────────────┬─────────────┘
             ▼
┌──────────────────────────┐
│ Ensemble Risk Engine     │
│ ML + Graph + Velocity    │
│ + Rules                  │
└────────────┬─────────────┘
             ▼
┌──────────────────────────┐
│ Policy / Routing         │
│ ALLOW / MONITOR / REVIEW │
│ HOLD / BLOCK             │
└────────────┬─────────────┘
             ▼
┌──────────────────────────┐
│ Analyst Console          │
│ rings • cases • policy   │
│ evaluation • live stream │
└──────────────────────────┘
             │
             ├── Firestore persistence
             └── SSE live transaction stream
```

## Risk ensemble

`0.40 × ML + 0.35 × Graph + 0.15 × Velocity + 0.10 × Rules`

The backend can operate without a trained model using its deterministic heuristic fallback, which keeps local demos reproducible.
