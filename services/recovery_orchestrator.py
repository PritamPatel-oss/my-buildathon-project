# services/recovery_orchestrator.py
import json
from sqlalchemy.orm import Session
from db.models import Transaction, RecoveryAttempt
from services.ai_diagnosis import diagnose_transaction
from services.ai_recommendation import recommend_action
from services.policy_engine import evaluate_policy
from services.audit_logger import log_recovery_attempt
from services.razorpay_client import create_payment_link


def process_recovery(
    db: Session,
    transaction: Transaction,
    simulate_ai_failure: bool = False,
    simulate_invalid_action: bool = False,
) -> dict:
    """
    Runs the full AI diagnosis -> recommendation -> policy -> execution pipeline
    for one transaction, and logs the result at every stage.

    simulate_ai_failure / simulate_invalid_action: demo-only flags that trigger
    the real fallback branches on demand (see Step 18 of the build) — they do
    not change any logic, only how the trigger is sourced.
    """
    if simulate_ai_failure:
        diagnosis_result = {
            "diagnosis": "unknown",
            "confidence": 0.0,
            "raw_response": "AI_ERROR: [DEMO] Simulated AI outage for fallback demonstration",
        }
    else:
        diagnosis_result = diagnose_transaction(
            transaction.failure_reason_raw, transaction.amount
        )

    # Fallback 1: diagnosis failed entirely
    if diagnosis_result["raw_response"].startswith("AI_ERROR"):
        return log_recovery_attempt(
            db=db,
            transaction_id=transaction.id,
            ai_diagnosis=diagnosis_result["diagnosis"],
            ai_raw_response=diagnosis_result["raw_response"],
            policy_decision="blocked",
            policy_reason="AI diagnosis failed — blocked automatically (fail-safe)",
        )

    recommendation_result = recommend_action(
        diagnosis_result["diagnosis"], transaction.amount
    )

    if simulate_invalid_action:
        recommendation_result = {
            "action": None,
            "confidence": recommendation_result["confidence"],
            "raw_response": recommendation_result["raw_response"]
            + " [DEMO: action overridden to invalid for fail-safe demonstration]",
        }

    recommended_action = recommendation_result["action"]

    # Fallback 2: recommendation failed or returned invalid/off-list action
    if recommended_action is None:
        return log_recovery_attempt(
            db=db,
            transaction_id=transaction.id,
            ai_diagnosis=diagnosis_result["diagnosis"],
            ai_recommended_action=None,
            ai_confidence=recommendation_result["confidence"],
            ai_raw_response=recommendation_result["raw_response"],
            policy_decision="blocked",
            policy_reason="AI recommendation invalid or failed — blocked automatically (fail-safe)",
        )

    # Deterministic policy gate — final say over every action, AI included
    policy_result = evaluate_policy(db, transaction, recommended_action)

    if policy_result["decision"] == "blocked":
        return log_recovery_attempt(
            db=db,
            transaction_id=transaction.id,
            ai_diagnosis=diagnosis_result["diagnosis"],
            ai_recommended_action=recommended_action,
            ai_confidence=recommendation_result["confidence"],
            ai_raw_response=recommendation_result["raw_response"],
            policy_decision="blocked",
            policy_reason=policy_result["reason"],
        )

    # Policy allowed: execute the action
    attempt_count = (
        db.query(RecoveryAttempt)
        .filter(RecoveryAttempt.transaction_id == transaction.id)
        .count()
    )
    reference_id = f"txn_{transaction.id}_attempt_{attempt_count + 1}"

    exec_result = create_payment_link(
        amount_inr=transaction.amount,
        email=transaction.customer_email,
        reference_id=reference_id,
    )
    payment_link_id = exec_result["response"].get("id") if exec_result["success"] else None

    return log_recovery_attempt(
        db=db,
        transaction_id=transaction.id,
        ai_diagnosis=diagnosis_result["diagnosis"],
        ai_recommended_action=recommended_action,
        ai_confidence=recommendation_result["confidence"],
        ai_raw_response=recommendation_result["raw_response"],
        policy_decision="allowed",
        policy_reason=policy_result["reason"],
        action_taken=recommended_action,
        execution_status="success" if exec_result["success"] else "failed",
        razorpay_response_raw=json.dumps(exec_result["response"]),
        payment_link_id=payment_link_id,
        amount_recovered=0.0,  # only set once payment is actually confirmed paid
    )
