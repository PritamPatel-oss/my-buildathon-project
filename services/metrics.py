# services/metrics.py
from sqlalchemy.orm import Session
from db.models import RecoveryAttempt
from services.risk_detector import get_total_revenue_at_risk


def get_recovery_metrics(db: Session) -> dict:
    """
    NOTE: recovery_rate_pct can exceed 100%. total_at_risk only counts
    currently failed/pending transactions; once one is marked 'recovered'
    it leaves that pool while total_recovered keeps accumulating. This is
    expected behavior, not a bug -- flag it if presenting this metric.
    """
    all_attempts = db.query(RecoveryAttempt).all()
    recovered_sum = round(sum(a.amount_recovered or 0.0 for a in all_attempts), 2)
    at_risk = get_total_revenue_at_risk(db)

    return {
        "total_recovered": recovered_sum,
        "total_at_risk": at_risk,
        "recovery_rate_pct": round((recovered_sum / at_risk) * 100, 2) if at_risk > 0 else 0.0,
    }
