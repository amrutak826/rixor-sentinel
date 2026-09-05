# Rixor Sentinel Backend

Python/FastAPI risk-intelligence service powering the Rixor Sentinel platform.

### Core capabilities

- Webhook authentication and payload validation
- O(1) transaction idempotency protection
- Customer ↔ device/IP/payment-instrument graph analysis
- Ensemble risk scoring: ML + graph + velocity + rules
- Policy-driven ALLOW / MONITOR / REVIEW / HOLD / BLOCK routing
- Real-time Server-Sent Events (SSE)
- Ring investigation endpoints
- Signed evidence dossier generation
- Optional Firestore persistence
- XGBoost training pipeline with held-out ring evaluation

## Local setup

```bash
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
copy .env.example .env  # Windows
# cp .env.example .env # macOS/Linux

uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

API docs: `http://localhost:8000/docs`

## Key endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/transactions/ingest` | Ingest and score a transaction |
| GET | `/api/transactions/stream` | Live SSE transaction stream |
| GET | `/api/transactions` | Recent transaction buffer |
| GET | `/api/health` | Health + graph metrics |
| GET | `/api/rings` | Detected syndicates |
| GET | `/api/rings/{ring_id}` | Ring details |
| POST | `/api/rings/{ring_id}/dossier` | Signed evidence dossier |
| GET/POST | `/api/users/{user_id}/policy` | Analyst policy |
| GET/POST | `/api/users/{user_id}/cases` | Investigation cases |

## Risk formula

```text
risk_score = 0.40 * ML_score
           + 0.35 * Graph_score
           + 0.15 * Velocity_score
           + 0.10 * Rules_score
```

## Model training

```bash
cd ml
python generate_synthetic_data.py --out data/transactions.csv --rings 100 --legit 8000
python train_model.py --data data/transactions.csv --out ../app/artifacts/model.pkl
```

Generated model/data artifacts are intentionally ignored by Git.

## Tests

```bash
pytest -v
```

## Security

Never commit `.env`, service-account JSON, private credentials, or production webhook secrets. Use environment variables / deployment secrets instead.
