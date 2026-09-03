# RecoverAI — Demo & Pitch Prep

## 1. The one-liner

> "RecoverAI diagnoses why a payment failed, decides how to recover it, and never lets AI touch money without a deterministic policy engine checking its work first."

Say this line first, before anything else. It contains your entire differentiator: **diagnosis → recommendation → policy gate → execution → audit**, with AI confined to the two steps that benefit from judgment, and everything money-related locked behind rules a judge can read in plain English.

## 2. The problem, in one breath

Businesses lose revenue to failed payments silently — a card declines, nothing happens, the customer never comes back. Most "recovery" is either manual (someone checks a spreadsheet) or blind automation (retry everything, blindly, until the customer complains). Neither diagnoses *why* it failed or *whether* recovering it is even a good idea.

## 3. Why the architecture is the pitch

Lead with this framing, because it's your strongest technical argument and most teams won't have it:

- **The system works with AI unplugged.** Steps 1–6 (schema → risk detection → policy engine → audit log) were built and tested *before* any AI call existed. If you're asked "what if the AI is wrong," the honest answer is: it can't do damage, because the policy engine — not the AI — has final say over every action.
- **Two independent fail-safes**, not one. AI diagnosis failing and AI recommending something off-policy are *different* failure modes, and your system labels and audits them differently rather than collapsing them into one generic "error."
- **Every AI call is fully auditable.** Raw JSON responses are stored, not just parsed output — so a judge can ask "what did the AI actually say" and you can show them, not paraphrase.

## 4. Live demo script (from Step 18, timed)

Run `python -m scripts.demo_seed` immediately before you go on stage — not earlier, so timestamps look fresh.

| Time | Beat | What you do | What you say |
|---|---|---|---|
| 0:00–0:15 | Open | Show the Risk Queue with total at-risk revenue | "Here's ₹14,000+ in revenue currently at risk, across six failure types." |
| 0:15–0:45 | Happy path (Priya, ₹799) | Click Run recovery → open link → pay with Razorpay test card → Refresh status | "Real diagnosis, real policy check, real payment link, real Razorpay confirmation. Nothing here is mocked." |
| 0:45–1:00 | Policy override (Rahul, ₹7,499) | Run recovery → instantly blocked | "The AI recommended recovery. The policy engine said no — amount exceeds our cap. The AI doesn't get veto power over business rules." |
| 1:00–1:15 | Retry limit (Amit) | Run recovery → blocked, no AI call shown as needed | "Three attempts, no luck — we stop. No spamming customers." |
| 1:15–1:25 | Duplicate protection (Neha) | Run recovery → blocked | "Already recovered. Zero risk of double-charging." |
| 1:25–1:50 | AI fail-safes (Vikram, Sana) | Fire both via curl with `simulate_ai_failure=true` / `simulate_invalid_action=true`, show Audit Trail tab | "If our AI vendor has an outage mid-transaction — which happens — the system fails *safe*, not silent. Both failure types are logged and labeled honestly." |
| 1:50–2:00 | Close | Point at Audit Trail table | "Every decision the system ever made is right here — who, why, and what happened next." |

**Backup plan:** if Anthropic or Razorpay is flaky right before you go on, don't gamble live — narrate the happy path from a pre-recorded clip and do beats 3–6 live instead. Nobody will know unless you tell them, so don't tell them.

## 5. Anticipated judge questions

**"What stops the AI from recommending a fraudulent or harmful action?"**
It can only choose from a fixed allowlist (`ALLOWED_ACTIONS`) that the policy engine independently validates — an off-list or null action is treated identically to an AI outage.

**"What's your actual recovery rate?"**
Be precise about what the number means: `recovery_rate_pct = total_recovered / total_at_risk`, where `total_at_risk` only counts currently failed/pending transactions. Once something's recovered, it leaves that denominator — so the number can technically exceed 100% over time. Name this proactively if you show the metric; it reads as rigor, not a bug you're hiding.

**"Why SQLite, why not Postgres?"**
Right choice for a hackathon-scope demo — zero setup, fully portable, same SQLAlchemy models port to Postgres with a one-line connection string change if this went to production.

**"How would this scale past a few hundred transactions a day?"**
The architecture doesn't need to change — the policy engine is pure and stateless-ish, AI calls are already isolated behind clean interfaces (`diagnose_transaction`, `recommend_action`), and execution is idempotent via `reference_id`. What would change: async/background job processing instead of synchronous request-response, and moving off SQLite.

**"What don't you have tested?"**
Say it straight: live network behavior against Anthropic/Razorpay (covered instead by one manual smoke test before demos), the React frontend, and the webhook-less polling flow for payment confirmation. Naming this unprompted is more credible than getting caught not knowing it.

**"Is this specific to Razorpay?"**
The execution layer is the only Razorpay-specific piece (`services/razorpay_client.py`). Diagnosis, recommendation, policy, and audit are all payment-gateway-agnostic — swapping in Stripe would mean writing one new client module, not touching the core pipeline.

## 6. Slide structure (if you need a deck, ~6 slides)

1. **Title + one-liner** (Section 1 above)
2. **The problem** — one stat, one sentence, no more
3. **Architecture diagram** — Transaction → Risk Detection → AI Diagnosis → AI Recommendation → Policy Engine → Execution → Audit Log. Draw the policy engine as a visibly separate box AI has to pass through, not a step alongside it.
4. **Live demo** (this is where you switch to the app)
5. **What makes this defensible** — the two-fail-safe design, deterministic core, full auditability
6. **What's next** — multi-gateway support, webhook-based status (not polling), production DB, richer action set

## 7. The 10-second version, if you only get that long

> "AI diagnoses failed payments and recommends how to recover them — but a deterministic policy engine has final say, so the AI can suggest, never override. Every decision is fully audited."

## 8. Pre-demo checklist

- [ ] `python -m scripts.demo_seed` run fresh, right before presenting
- [ ] `pytest -v` green
- [ ] Anthropic + Razorpay test-mode keys valid and not rate-limited
- [ ] One successful end-to-end happy-path run completed *today*, not yesterday
- [ ] Backup recording of the happy path ready, in case live APIs misbehave
- [ ] Audit Trail tab pre-loaded once so there's no cold-start lag on stage
