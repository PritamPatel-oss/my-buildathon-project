# services/risk_detector.py
from sqlalchemy.orm import Session
from db.models import Transaction

AT_RISK_STATUSES = ["failed", "pending"]


def get_at_risk_transactions(db: Session, user_id: int = None):
    query = db.query(Transaction).filter(Transaction.status.in_(AT_RISK_STATUSES))
    if user_id is not None:
        query = query.filter((Transaction.user_id == user_id) | (Transaction.user_id == None))
    return query.order_by(Transaction.created_at.desc()).all()


def get_total_revenue_at_risk(db: Session, user_id: int = None) -> float:
    txns = get_at_risk_transactions(db, user_id=user_id)
    return round(sum(t.amount for t in txns), 2)

