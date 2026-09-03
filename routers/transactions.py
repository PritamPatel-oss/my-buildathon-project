# routers/transactions.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from db.database import SessionLocal
from db.models import Transaction, RecoveryAttempt
from services.risk_detector import get_at_risk_transactions, get_total_revenue_at_risk
from services.recovery_orchestrator import process_recovery
from services.recovery_status import refresh_payment_status
from services.metrics import get_recovery_metrics

router = APIRouter(prefix="/transactions", tags=["transactions"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---- static routes first (see note below) -----------------------------

@router.get("/")
def list_transactions(db: Session = Depends(get_db)):
    return db.query(Transaction).order_by(Transaction.created_at.desc()).all()


@router.get("/risk/at-risk")
def list_at_risk(db: Session = Depends(get_db)):
    return {
        "total_at_risk": get_total_revenue_at_risk(db),
        "transactions": get_at_risk_transactions(db),
    }


@router.get("/audit/all")
def get_all_audit_attempts(db: Session = Depends(get_db)):
    """
    Global audit trail: every recovery attempt across every transaction,
    newest first, joined with the customer/amount for display.
    """
    attempts = (
        db.query(RecoveryAttempt)
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
            "amount_recovered": a.amount_recovered,
            "created_at": a.created_at,
        })
    return result


@router.get("/metrics/summary")
def metrics_summary(db: Session = Depends(get_db)):
    return get_recovery_metrics(db)


@router.post("/recovery-attempts/{attempt_id}/refresh-status")
def refresh_status_endpoint(attempt_id: int, db: Session = Depends(get_db)):
    result = refresh_payment_status(db, attempt_id)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


# ---- dynamic {txn_id} routes -------------------------------------------
# NOTE: {txn_id} is typed as int, so FastAPI/Starlette builds a \d+ regex for
# it -- non-numeric static paths above (e.g. "audit", "risk", "metrics")
# never match this pattern, so route registration order here is for
# readability, not correctness.

@router.get("/{txn_id}")
def get_transaction(txn_id: int, db: Session = Depends(get_db)):
    txn = db.query(Transaction).filter(Transaction.id == txn_id).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return txn


@router.get("/{txn_id}/audit-trail")
def get_audit_trail(txn_id: int, db: Session = Depends(get_db)):
    return (
        db.query(RecoveryAttempt)
        .filter(RecoveryAttempt.transaction_id == txn_id)
        .order_by(RecoveryAttempt.created_at.desc())
        .all()
    )


@router.post("/{txn_id}/process-recovery")
def process_recovery_endpoint(
    txn_id: int,
    simulate_ai_failure: bool = False,
    simulate_invalid_action: bool = False,
    db: Session = Depends(get_db),
):
    txn = db.query(Transaction).filter(Transaction.id == txn_id).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")

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

    return {"outcome": outcome, "attempt": attempt}
