# RecoverAI

Diagnosed, policy-bounded payment recovery. A rule-based engine diagnoses why
a payment failed and recommends how to recover it; a separate deterministic
policy engine has final say over whether that action ever executes.

## Architecture

```
Transaction → Risk Detection → Rule-Based Diagnosis → Recommendation
            → Policy Engine (deterministic gate) → Execution (Razorpay)
            → Audit Log
```

The policy engine and the diagnosis engine are two independent, deterministic
components. Recommendations are generated locally (see
`services/ai_diagnosis.py` and `services/ai_recommendation.py`) with no
external API call and no per-request cost --
there is no network dependency in the diagnosis step, so there's nothing to
fail, time out, or rate-limit mid-transaction. The policy engine
independently validates every recommended action against a fixed allowlist
before anything executes.

## Project layout

```
RecoverAI/
  main.py                    FastAPI app entrypoint
  db/                        SQLAlchemy models + session
  routers/                   API routes
  services/                  Risk detection, policy engine, diagnosis engine,
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
# edit .env with your Razorpay TEST-mode keys
# (rzp_test_... — never put live keys in this project)

python -m scripts.seed_data      # random dataset, or:
python -m scripts.demo_seed      # curated dataset for a live demo

uvicorn main:app --reload
```

API docs (Swagger) are then available at `http://localhost:8000/docs`.

No API key, external account, or billing setup is required to run the
diagnosis/recommendation step -- it's local and free. Only Razorpay
(test-mode) credentials are needed, and Razorpay's test mode never moves
real money regardless of usage.

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

Covers the policy engine in isolation, the diagnosis fail-safe path (a
malformed/unknown failure reason falls back to a low-confidence default
recommendation rather than guessing wildly), proof that a policy block
genuinely prevents a Razorpay call, duplicate-retry prevention across two
orchestrator calls, and the API surface including the audit endpoints. Does
**not** cover live Razorpay network behavior, the React frontend, or the
webhook-less status-polling flow -- those are out of scope for a
mocked-boundary test suite.

## Key API endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/transactions/` | List all transactions |
| GET | `/transactions/risk/at-risk` | At-risk transactions + total |
| GET | `/transactions/audit/all` | Global audit trail (all attempts) |
| GET | `/transactions/{id}/audit-trail` | Audit trail for one transaction |
| GET | `/transactions/metrics/summary` | Recovered / at-risk / rate |
| GET | `/transactions/{id}` | Single transaction |
| POST | `/transactions/{id}/process-recovery` | Run the diagnosis→policy→execution pipeline |
| POST | `/transactions/recovery-attempts/{id}/refresh-status` | Poll Razorpay for payment status |

`process-recovery` accepts an optional query param for demo purposes:
`?simulate_invalid_action=true` -- this triggers the policy-block fail-safe
on demand, not a fake one. (`simulate_ai_failure` no longer applies, since
diagnosis has no external call left to fail.)

## Known metric quirk

`recovery_rate_pct` in `/transactions/metrics/summary` can exceed 100%.
`total_at_risk` only counts currently `failed`/`pending` transactions; once
one is marked `recovered` it leaves that pool while `total_recovered` keeps
accumulating. This is expected, not a bug -- worth mentioning proactively if
presenting the number.

## Demo script

See the full run-of-show, timing, and anticipated Q&A in
`RecoverAI_Demo_Pitch_Prep.md` (shared separately). Short version: run
`python -m scripts.demo_seed` fresh right before presenting, then walk
through the seeded transactions -- each one exercises a different path
(happy path, amount cap, retry limit, duplicate, and the policy fail-safe).