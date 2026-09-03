# RecoverAI — Demo & Pitch Prep

## 1. The one-liner

> "RecoverAI diagnoses why a payment failed, decides how to recover it, and never lets that recommendation touch money without a deterministic policy engine checking its work first."

Say this line first, before anything else. It contains your entire differentiator: **diagnosis → recommendation → policy gate → execution → audit**, with the recommendation step confined to a fixed, auditable rule set, and everything money-related locked behind rules a judge can read in plain English.

## 2. The problem, in one breath

Businesses lose revenue to failed payments silently — a card declines, nothing happens, the customer never comes back. Most "recovery" is either manual (someone checks a spreadsheet) or blind automation (retry everything, blindly, until the customer complains). Neither diagnoses *why* it failed or *whether* recovering it is even a good idea.

## 3. Why the architecture is the pitch

Lead with this framing, because it's your strongest technical argument and most teams won't have it:

- **The system has no external dependency in its decision path.** Diagnosis and recommendation are rule-based and run locally — no network call, no API key, no vendor outage risk, no per-request cost. If you're asked "what if your AI vendor goes down mid-demo," the honest answer is: there isn't one to go down.
- **The policy engine is still fully independent of the diagnosis step.** Recommendations are just that — recommendations. The policy engine validates every one against a fixed allowlist (`ALLOWED_ACTIONS`) before anything executes, regardless of where the recommendation came from.
- **Every recommendation is fully auditable.** The raw recommendation string and the reasoning that produced it are stored, not just the parsed output — so a judge can ask "what did the system actually decide and why" and you can show them, not paraphrase.

*(Framing note: earlier drafts of this project used a live Anthropic API call for diagnosis. That's been replaced with a deterministic rule-based engine — cheaper to run, nothing to rate-limit or authenticate against on stage, and it removes an entire class of demo-day risk. If a judge asks why it's not LLM-based, the honest answer is above: it doesn't need to be, and the policy-engine story is unaffected either way.)*

## 4. Live demo script (timed)

Run `python -m scripts.demo_seed` immediately before you go on stage — not earlier, so timestamps look fresh.

| Time | Beat | What you do | What you say |
|---|---|---|---|
| 0:00–0:15 | Open | Show the Risk Queue with total at-risk revenue | "Here's ₹14,000+ in revenue currently at risk, across six failure types." |
| 0:15–0:45 | Happy path (Priya, ₹799) | Click Run recovery → open link → pay with Razorpay test card → Refresh status | "Real diagnosis, real policy check, real payment link, real Razorpay confirmation. The recovery link you just paid is a live Razorpay test-mode link." |
| 0:45–1:00 | Policy override (Rahul, ₹7,499) | Run recovery → instantly blocked | "The system recommended recovery. The policy engine said no — amount exceeds our cap. Recommendations never get veto power over business rules." |
| 1:00–1:15 | Retry limit (Amit) | Run recovery → blocked | "Three attempts, no luck — we stop. No spamming customers." |
| 1:15–1:25 | Duplicate protection (Neha) | Run recovery → blocked | "Already recovered. Zero risk of double-charging." |
| 1:25–1:45 | Policy fail-safe (Sana) | Fire via curl with `simulate_invalid_action=true`, show Audit Trail tab | "If the recommendation step ever produced something outside our allowlist — corrupted state, bad input, anything — the policy engine blocks it exactly the same as it blocks a business-rule violation. One gate, no exceptions." |
| 1:45–2:00 | Close | Point at Audit Trail table | "Every decision the system ever made is right here — who, why, and what happened next." |

**Backup plan:** if Razorpay is flaky right before you go on, don't gamble live — narrate the happy path from a pre-recorded clip and do the other beats live instead. Nobody will know unless you tell them, so don't tell them.

## 5. Anticipated judge questions

**"What stops the system from recommending a fraudulent or harmful action?"**
It can only choose from a fixed allowlist (`ALLOWED_ACTIONS`) that the policy engine independently validates — an off-list or malformed action is blocked automatically, the same fail-safe path regardless of cause.

**"Why isn't diagnosis LLM-based? Isn't that less impressive?"**
It's a deliberate trade-off, not a limitation you're hiding: rule-based diagnosis is deterministic, free to run, has no vendor outage risk, and is trivially testable (no mocking a network call). The genuinely hard, defensible part of this system — the policy engine gating every action before execution — works identically either way. If the diagnosis step gets more sophisticated later, it plugs into the exact same policy gate without changing the architecture.

**"What's your actual recovery rate?"**
Be precise about what the number means: `recovery_rate_pct = total_recovered / total_at_risk`, where `total_at_risk` only counts currently failed/pending transactions. Once something's recovered, it leaves that denominator — so the number can technically exceed 100% over time. Name this proactively if you show the metric; it reads as rigor, not a bug you're hiding.

**"Why SQLite, why not Postgres?"**
Right choice for a hackathon-scope demo — zero setup, fully portable, same SQLAlchemy models port to Postgres with a one-line connection string change if this went to production.

**"How would this scale past a few hundred transactions a day?"**
The architecture doesn't need to change — the policy engine is pure and stateless-ish, the diagnosis step is already isolated behind a clean interface (`recommend_action`), and execution is idempotent via `reference_id`. What would change: async/background job processing instead of synchronous request-response, and moving off SQLite.

**"What don't you have tested?"**
Say it straight: live network behavior against Razorpay (covered instead by one manual smoke test before demos), the React frontend, and the webhook-less polling flow for payment confirmation. Naming this unprompted is more credible than getting caught not knowing it.

**"Is this specific to Razorpay?"**
The execution layer is the only Razorpay-specific piece (`services/razorpay_client.py`). Diagnosis, recommendation, policy, and audit are all payment-gateway-agnostic — swapping in Stripe would mean writing one new client module, not touching the core pipeline.

## 6. Slide structure (if you need a deck, ~6 slides)

1. **Title + one-liner** (Section 1 above)
2. **The problem** — one stat, one sentence, no more
3. **Architecture diagram** — Transaction → Risk Detection → Diagnosis → Recommendation → Policy Engine → Execution → Audit Log. Draw the policy engine as a visibly separate box every recommendation has to pass through, not a step alongside it.
4. **Live demo** (this is where you switch to the app)
5. **What makes this defensible** — deterministic core throughout, zero external dependency in the decision path, full auditability
6. **What's next** — multi-gateway support, webhook-based status (not polling), production DB, optional pluggable ML/LLM diagnosis behind the same policy gate

## 7. The 10-second version, if you only get that long

> "The system diagnoses failed payments and recommends how to recover them — but a deterministic policy engine has final say, so a recommendation can suggest, never override. Every decision is fully audited, and the whole pipeline runs with zero external dependencies or per-request cost."

## 8. Pre-demo checklist

- [ ] `python -m scripts.demo_seed` run fresh, right before presenting
- [ ] `pytest -v` green
- [ ] Razorpay test-mode keys valid and not rate-limited
- [ ] One successful end-to-end happy-path run completed *today*, not yesterday
- [ ] Backup recording of the happy path ready, in case Razorpay misbehaves
- [ ] Audit Trail tab pre-loaded once so there's no cold-start lag on stage