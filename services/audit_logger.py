# services/audit_logger.py
from sqlalchemy.orm import Session
from db.models import RecoveryAttempt


def log_recovery_attempt(
    db: Session,
    transaction_id: int,
    policy_decision: str,
    policy_reason: str,
    ai_diagnosis: str = None,
    ai_recommended_action: str = None,
    ai_confidence: float = None,
    ai_raw_response: str = None,
    action_taken: str = None,
    execution_status: str = None,
    razorpay_response_raw: str = None,
    payment_link_id: str = None,
    amount_recovered: float = 0.0,
) -> RecoveryAttempt:
    attempt = RecoveryAttempt(
        transaction_id=transaction_id,
        ai_diagnosis=ai_diagnosis,
        ai_recommended_action=ai_recommended_action,
        ai_confidence=ai_confidence,
        ai_raw_response=ai_raw_response,
        policy_decision=policy_decision,
        policy_reason=policy_reason,
        action_taken=action_taken,
        execution_status=execution_status,
        razorpay_response_raw=razorpay_response_raw,
        payment_link_id=payment_link_id,
        amount_recovered=amount_recovered,
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    return attempt
