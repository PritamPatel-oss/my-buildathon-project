# services/risk_detector.py
from sqlalchemy.orm import Session
from db.models import Transaction

AT_RISK_STATUSES = ["failed", "pending"]


def get_at_risk_transactions(db: Session):
    return (
        db.query(Transaction)
        .filter(Transaction.status.in_(AT_RISK_STATUSES))
        .order_by(Transaction.created_at.desc())
        .all()
    )


def get_total_revenue_at_risk(db: Session) -> float:
    txns = get_at_risk_transactions(db)
    return round(sum(t.amount for t in txns), 2)
