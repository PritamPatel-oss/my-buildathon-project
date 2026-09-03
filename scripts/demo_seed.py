# scripts/demo_seed.py
"""
Curated dataset for the live demo. Every transaction here targets one specific
system behavior — unlike scripts/seed_data.py, nothing here is random.
Run with: python -m scripts.demo_seed
"""
from datetime import datetime, timedelta, timezone
from db.database import SessionLocal, engine
from db.models import Base, Transaction, RecoveryAttempt


def _now():
    return datetime.now(timezone.utc)


def reset_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def seed():
    reset_db()
    db = SessionLocal()

    # 1. HAPPY PATH — rule-based diagnosis, real policy pass, real Razorpay link.
    #    Pay it live with a Razorpay test card, then hit "Refresh status".
    happy = Transaction(
        customer_email="priya.sharma@demo.com", amount=799.0, currency="INR",
        status="failed", failure_reason_raw="insufficient_funds",
        created_at=_now() - timedelta(hours=3),
    )

    # 2. POLICY BLOCK — amount cap. The recommendation engine will still
    #    recommend the action; the policy engine overrules it independently.
    over_cap = Transaction(
        customer_email="rahul.mehta@demo.com", amount=7499.0, currency="INR",
        status="failed", failure_reason_raw="card_expired",
        created_at=_now() - timedelta(hours=5),
    )

    # 3. POLICY BLOCK — retry limit (3 prior attempts pre-seeded below).
    retry_limited = Transaction(
        customer_email="amit.verma@demo.com", amount=1299.0, currency="INR",
        status="failed", failure_reason_raw="bank_declined",
        created_at=_now() - timedelta(hours=8),
    )

    # 4. POLICY BLOCK — duplicate (1 prior success pre-seeded below).
    duplicate = Transaction(
        customer_email="neha.kapoor@demo.com", amount=2199.0, currency="INR",
        status="failed", failure_reason_raw="payment_timeout",
        created_at=_now() - timedelta(hours=10),
    )

    # 5. General recovery-eligible transaction for extra demo variety.
    network_demo = Transaction(
        customer_email="vikram.rao@demo.com", amount=1599.0, currency="INR",
        status="failed", failure_reason_raw="network_error",
        created_at=_now() - timedelta(hours=1),
    )

    # 6. POLICY FAIL-SAFE — trigger live with ?simulate_invalid_action=true
    #    to show the policy engine blocking an off-allowlist recommendation.
    invalid_action_demo = Transaction(
        customer_email="sana.iyer@demo.com", amount=999.0, currency="INR",
        status="failed", failure_reason_raw="invalid_otp",
        created_at=_now() - timedelta(hours=2),
    )

    db.add_all([happy, over_cap, retry_limited, duplicate, network_demo, invalid_action_demo])
    db.commit()

    for i in range(3):
        db.add(RecoveryAttempt(
            transaction_id=retry_limited.id,
            ai_diagnosis="bank_declined", ai_recommended_action="resend_payment_link",
            ai_confidence=0.8, ai_raw_response='RULE_BASED: resend_payment_link | seed data',
            policy_decision="allowed", policy_reason="All policy checks passed",
            action_taken="resend_payment_link", execution_status="failed",
            razorpay_response_raw='{"error": "demo seed — simulated prior failed attempt"}',
            amount_recovered=0.0, created_at=_now() - timedelta(hours=8 - i),
        ))

    db.add(RecoveryAttempt(
        transaction_id=duplicate.id,
        ai_diagnosis="payment_timeout", ai_recommended_action="resend_payment_link",
        ai_confidence=0.9, ai_raw_response='RULE_BASED: resend_payment_link | seed data',
        policy_decision="allowed", policy_reason="All policy checks passed",
        action_taken="resend_payment_link", execution_status="success",
        razorpay_response_raw='{"id": "plink_demo_seed", "status": "created"}',
        amount_recovered=0.0, created_at=_now() - timedelta(hours=10),
    ))

    db.commit()
    db.close()
    print("Demo dataset seeded: happy path, cap block, retry-limit block, "
          "duplicate block, and policy fail-safe scenario.")


if __name__ == "__main__":
    seed()