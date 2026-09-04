# routers/transactions.py
import json
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from db.database import SessionLocal
from db.models import Transaction, RecoveryAttempt, User
from services.risk_detector import get_at_risk_transactions, get_total_revenue_at_risk
from services.recovery_orchestrator import process_recovery
from services.recovery_status import refresh_payment_status
from services.metrics import get_recovery_metrics
from services.auth import get_current_user

router = APIRouter(prefix="/transactions", tags=["transactions"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _extract_payment_url(razorpay_response_raw: Optional[str]) -> Optional[str]:
    if not razorpay_response_raw:
        return None
    try:
        data = json.loads(razorpay_response_raw)
        return data.get("short_url")
    except Exception:
        return None


class CreateTransactionRequest(BaseModel):
    customer_email: str
    amount: float
    currency: str = "INR"
    failure_reason_raw: str = "insufficient_funds"


# ---- static routes first ----------------------------------------------

@router.get("/")
def list_transactions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Transaction)
        .filter((Transaction.user_id == current_user.id) | (Transaction.user_id == None))
        .order_by(Transaction.created_at.desc())
        .all()
    )


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_transaction(
    payload: CreateTransactionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    txn = Transaction(
        user_id=current_user.id,
        customer_email=payload.customer_email,
        amount=round(float(payload.amount), 2),
        currency=payload.currency,
        status="failed",
        failure_reason_raw=payload.failure_reason_raw,
    )
    db.add(txn)
    db.commit()
    db.refresh(txn)
    return txn


@router.get("/risk/at-risk")
def list_at_risk(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return {
        "total_at_risk": get_total_revenue_at_risk(db, user_id=current_user.id),
        "transactions": get_at_risk_transactions(db, user_id=current_user.id),
    }


@router.get("/audit/all")
def get_all_audit_attempts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Global audit trail: every recovery attempt across every transaction,
    newest first, joined with customer/amount and payment link URL.
    """
    # Restrict to user's transactions + demo transactions
    user_txns = (
        db.query(Transaction.id)
        .filter((Transaction.user_id == current_user.id) | (Transaction.user_id == None))
        .all()
    )
    allowed_ids = {t.id for t in user_txns}

    attempts = (
        db.query(RecoveryAttempt)
        .filter(RecoveryAttempt.transaction_id.in_(allowed_ids))
        .order_by(RecoveryAttempt.created_at.desc())
        .all()
    )

    result = []
    for a in attempts:
        txn = db.query(Transaction).filter(Transaction.id == a.transaction_id).first()
        result.append({
            "id": a.id,
            "transaction_id": a.transaction_id,
            "customer_email": txn.customer_email if txn else None,
            "amount": txn.amount if txn else None,
            "ai_diagnosis": a.ai_diagnosis,
            "ai_recommended_action": a.ai_recommended_action,
            "ai_confidence": a.ai_confidence,
            "policy_decision": a.policy_decision,
            "policy_reason": a.policy_reason,
            "action_taken": a.action_taken,
            "execution_status": a.execution_status,
            "payment_link_id": a.payment_link_id,
            "payment_link_url": _extract_payment_url(a.razorpay_response_raw),
            "amount_recovered": a.amount_recovered,
            "created_at": a.created_at,
        })
    return result


@router.get("/metrics/summary")
def metrics_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_recovery_metrics(db, user_id=current_user.id)


@router.post("/recovery-attempts/{attempt_id}/refresh-status")
def refresh_status_endpoint(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    attempt = db.query(RecoveryAttempt).filter(RecoveryAttempt.id == attempt_id).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Recovery attempt not found")

    txn = db.query(Transaction).filter(Transaction.id == attempt.transaction_id).first()
    if txn and txn.user_id is not None and txn.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this recovery attempt")

    result = refresh_payment_status(db, attempt_id)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


# ---- dynamic {txn_id} routes -------------------------------------------

@router.get("/{txn_id}")
def get_transaction(
    txn_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    txn = db.query(Transaction).filter(Transaction.id == txn_id).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    if txn.user_id is not None and txn.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this transaction")
    return txn


@router.get("/{txn_id}/audit-trail")
def get_audit_trail(
    txn_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    txn = db.query(Transaction).filter(Transaction.id == txn_id).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    if txn.user_id is not None and txn.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this transaction")

    attempts = (
        db.query(RecoveryAttempt)
        .filter(RecoveryAttempt.transaction_id == txn_id)
        .order_by(RecoveryAttempt.created_at.desc())
        .all()
    )

    result = []
    for a in attempts:
        result.append({
            "id": a.id,
            "transaction_id": a.transaction_id,
            "ai_diagnosis": a.ai_diagnosis,
            "ai_recommended_action": a.ai_recommended_action,
            "ai_confidence": a.ai_confidence,
            "policy_decision": a.policy_decision,
            "policy_reason": a.policy_reason,
            "action_taken": a.action_taken,
            "execution_status": a.execution_status,
            "payment_link_id": a.payment_link_id,
            "payment_link_url": _extract_payment_url(a.razorpay_response_raw),
            "amount_recovered": a.amount_recovered,
            "created_at": a.created_at,
        })
    return result


@router.post("/{txn_id}/process-recovery")
def process_recovery_endpoint(
    txn_id: int,
    simulate_ai_failure: bool = False,
    simulate_invalid_action: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    txn = db.query(Transaction).filter(Transaction.id == txn_id).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    if txn.user_id is not None and txn.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this transaction")

    attempt = process_recovery(
        db, txn,
        simulate_ai_failure=simulate_ai_failure,
        simulate_invalid_action=simulate_invalid_action,
    )

    if attempt.policy_decision == "blocked":
        outcome = "blocked"
    elif attempt.execution_status == "success":
        outcome = "executed"
    else:
        outcome = "execution_failed"

    payment_url = _extract_payment_url(attempt.razorpay_response_raw)

    return {
        "outcome": outcome,
        "attempt": attempt,
        "payment_link_url": payment_url,
    }

