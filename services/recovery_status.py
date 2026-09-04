# services/recovery_status.py
from sqlalchemy.orm import Session
from db.models import RecoveryAttempt, Transaction
from services.razorpay_client import fetch_payment_link


def refresh_payment_status(db: Session, attempt_id: int) -> dict:
    attempt = db.query(RecoveryAttempt).filter(RecoveryAttempt.id == attempt_id).first()
    if not attempt or not attempt.payment_link_id:
        return {"error": "No payment link associated with this attempt"}

    result = fetch_payment_link(attempt.payment_link_id)
    if not result["success"]:
        return {"error": "Could not reach Razorpay", "detail": result["response"]}

    status = result["response"].get("status")
    if status == "paid":
        attempt.amount_recovered = float(result["response"].get("amount_paid", 0)) / 100.0
        txn = db.query(Transaction).filter(Transaction.id == attempt.transaction_id).first()
        if txn:
            txn.status = "recovered"
        db.commit()

    return {"status": status}

