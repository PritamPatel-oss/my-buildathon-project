# RecoverAI

AI-diagnosed, policy-bounded payment recovery. AI recommends how to recover a
failed transaction; a deterministic policy engine — not the AI — has final
say over whether that action ever executes.

## Architecture

```
Transaction → Risk Detection → AI Diagnosis → AI Recommendation
            → Policy Engine (deterministic gate) → Execution (Razorpay)
            → Audit Log
```

The policy engine works completely with AI unplugged (it's built and tested
before any AI call exists in the pipeline). AI failures and off-policy AI
outputs are two distinct, honestly-labeled fail-safe paths that block
execution rather than guessing.

## Project layout

```
RecoverAI/
  main.py                    FastAPI app entrypoint
  db/                        SQLAlchemy models + session
  routers/                   API routes
  services/                  Risk detection, policy engine, AI calls,
                              orchestrator, Razorpay client, metrics
  scripts/
    seed_data.py              Random synthetic dataset (25 txns)
    demo_seed.py               Curated, deterministic dataset for live demos
  tests/                      pytest suite (policy engine, orchestrator, API)
  frontend/                   Vite + React + Tailwind dashboard
```

## Backend setup

```bash
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# edit .env with your real ANTHROPIC_API_KEY and Razorpay TEST-mode keys
# (rzp_test_... — never put live keys in this project)

python -m scripts.seed_data      # random dataset, or:
python -m scripts.demo_seed      # curated dataset for a live demo

uvicorn main:app --reload
```

API docs (Swagger) are then available at `http://localhost:8000/docs`.

## Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Opens at `http://localhost:5173` by default. It expects the backend running
at `http://localhost:8000` (see `API_BASE` in `src/App.jsx`).

## Running tests

```bash
pytest -v
```

Covers the policy engine in isolation, both AI fail-safe layers (mocked, no
network calls), proof that a policy block genuinely prevents a Razorpay call,
duplicate-retry prevention across two orchestrator calls, and the API surface
including the audit endpoints. Does **not** cover live Anthropic/Razorpay
network behavior, the React frontend, or the webhook-less status-polling
flow — those are out of scope for a mocked-boundary test suite.

## Key API endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/transactions/` | List all transactions |
| GET | `/transactions/risk/at-risk` | At-risk transactions + total |
| GET | `/transactions/audit/all` | Global audit trail (all attempts) |
| GET | `/transactions/{id}/audit-trail` | Audit trail for one transaction |
| GET | `/transactions/metrics/summary` | Recovered / at-risk / rate |
| GET | `/transactions/{id}` | Single transaction |
| POST | `/transactions/{id}/process-recovery` | Run the AI→policy→execution pipeline |
| POST | `/transactions/recovery-attempts/{id}/refresh-status` | Poll Razorpay for payment status |

`process-recovery` accepts two optional query params for demo purposes:
`?simulate_ai_failure=true` and `?simulate_invalid_action=true` — these
trigger the real fallback code paths on demand, not fake ones.

## Known metric quirk

`recovery_rate_pct` in `/transactions/metrics/summary` can exceed 100%.
`total_at_risk` only counts currently `failed`/`pending` transactions; once
one is marked `recovered` it leaves that pool while `total_recovered` keeps
accumulating. This is expected, not a bug — worth mentioning proactively if
presenting the number.

## Demo script

See the full run-of-show, timing, and anticipated Q&A in
`RecoverAI_Demo_Pitch_Prep.md` (shared separately). Short version: run
`python -m scripts.demo_seed` fresh right before presenting, then walk
through the six seeded transactions — each one exercises a different path
(happy path, amount cap, retry limit, duplicate, and both AI fail-safes).
