# services/policy_engine.py
from sqlalchemy.orm import Session
from db.models import Transaction, RecoveryAttempt

MAX_RETRY_ATTEMPTS = 3
MAX_RECOVERABLE_AMOUNT = 5000.0
ELIGIBLE_STATUSES = ["failed", "pending"]
ALLOWED_ACTIONS = ["resend_payment_link"]  # extend later if needed


def evaluate_policy(db: Session, transaction: Transaction, recommended_action: str) -> dict:
    """Returns {'decision': 'allowed'|'blocked', 'reason': str}"""

    if transaction.status not in ELIGIBLE_STATUSES:
        return _blocked(f"Transaction status '{transaction.status}' not eligible")

    if recommended_action not in ALLOWED_ACTIONS:
        return _blocked(f"Action '{recommended_action}' not in allowed action list")

    if transaction.amount > MAX_RECOVERABLE_AMOUNT:
        return _blocked(f"Amount {transaction.amount} exceeds cap {MAX_RECOVERABLE_AMOUNT}")

    past_attempts = (
        db.query(RecoveryAttempt)
        .filter(RecoveryAttempt.transaction_id == transaction.id)
        .all()
    )

    if any(a.execution_status == "success" for a in past_attempts):
        return _blocked("Duplicate: transaction already successfully recovered")

    if len(past_attempts) >= MAX_RETRY_ATTEMPTS:
        return _blocked(f"Retry limit reached ({MAX_RETRY_ATTEMPTS})")

    return {"decision": "allowed", "reason": "All policy checks passed"}


def _blocked(reason: str) -> dict:
    return {"decision": "blocked", "reason": reason}
