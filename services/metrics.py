# services/metrics.py
from sqlalchemy.orm import Session
from db.models import RecoveryAttempt, Transaction
from services.risk_detector import get_total_revenue_at_risk


def get_recovery_metrics(db: Session, user_id: int = None) -> dict:
    """
    Returns recovery metrics summary.
    Preserves total_recovered, total_at_risk, and recovery_rate_pct for
    full backwards compatibility while providing counts for KPI cards.
    """
    txns_q = db.query(Transaction)
    if user_id is not None:
        txns_q = txns_q.filter((Transaction.user_id == user_id) | (Transaction.user_id == None))
        valid_txn_ids = [t.id for t in txns_q.all()]
        all_attempts = (
            db.query(RecoveryAttempt)
            .filter(RecoveryAttempt.transaction_id.in_(valid_txn_ids))
            .all()
        )
    else:
        all_attempts = db.query(RecoveryAttempt).all()

    recovered_sum = round(sum(a.amount_recovered or 0.0 for a in all_attempts), 2)
    at_risk = get_total_revenue_at_risk(db, user_id=user_id)

    total_transactions = txns_q.count()
    successful_recoveries = txns_q.filter(Transaction.status == "recovered").count()
    blocked_attempts = sum(1 for a in all_attempts if a.policy_decision == "blocked")
    failed_attempts = sum(1 for a in all_attempts if a.execution_status == "failed")
    total_attempts = len(all_attempts)

    recovery_rate_pct = round((recovered_sum / at_risk) * 100, 2) if at_risk > 0 else 0.0

    return {
        "total_recovered": recovered_sum,
        "total_at_risk": at_risk,
        "recovery_rate_pct": recovery_rate_pct,
        "total_transactions": total_transactions,
        "successful_recoveries": successful_recoveries,
        "blocked_attempts": blocked_attempts,
        "failed_attempts": failed_attempts,
        "total_attempts": total_attempts,
    }

