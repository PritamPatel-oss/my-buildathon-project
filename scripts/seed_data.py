# scripts/seed_data.py
import random
from datetime import datetime, timedelta, timezone
from db.database import SessionLocal, init_db
from db.models import Transaction

FAILURE_REASONS = [
    "insufficient_funds",
    "card_expired",
    "bank_declined",
    "payment_timeout",
    "invalid_otp",
    "network_error",
]

STATUSES_WEIGHTED = ["failed"] * 6 + ["pending"] * 2 + ["created"] * 1 + ["recovered"] * 1


def generate_transactions(n=25):
    db = SessionLocal()
    for i in range(n):
        status = random.choice(STATUSES_WEIGHTED)
        txn = Transaction(
            customer_email=f"user{i}@example.com",
            amount=round(random.uniform(199, 4999), 2),
            currency="INR",
            status=status,
            failure_reason_raw=random.choice(FAILURE_REASONS) if status == "failed" else None,
            created_at=datetime.now(timezone.utc) - timedelta(hours=random.randint(1, 72)),
        )
        db.add(txn)
    db.commit()
    db.close()
    print(f"Seeded {n} transactions.")


if __name__ == "__main__":
    init_db()
    generate_transactions()