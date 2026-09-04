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
) -> RecoveryAttempt:

    # STEP 1: AI DIAGNOSIS
    if simulate_ai_failure:
        diagnosis_result = {
            "diagnosis": "unknown",
            "confidence": 0.0,
            "raw_response": (
                "AI_ERROR: [DEMO] Simulated AI outage "
                "for fallback demonstration"
            ),
        }
    else:
        diagnosis_result = diagnose_transaction(
            transaction.failure_reason_raw,
            transaction.amount,
        )

    # FALLBACK 1: AI DIAGNOSIS FAILURE
    if (
        not diagnosis_result
        or not isinstance(diagnosis_result, dict)
        or diagnosis_result.get("raw_response", "").startswith("AI_ERROR")
        or diagnosis_result.get("diagnosis") in (None, "")
    ):
        return log_recovery_attempt(
            db=db,
            transaction_id=transaction.id,
            ai_diagnosis=diagnosis_result.get("diagnosis") if isinstance(diagnosis_result, dict) else "unknown",
            ai_raw_response=diagnosis_result.get("raw_response", "AI_ERROR: invalid diagnosis response") if isinstance(diagnosis_result, dict) else "AI_ERROR: invalid diagnosis response",
            policy_decision="blocked",
            policy_reason=(
                "AI diagnosis failed — blocked automatically "
                "(fail-safe)"
            ),
        )

    # STEP 2: AI RECOMMENDATION
    recommendation_result = recommend_action(
        diagnosis_result["diagnosis"],
        transaction.amount,
    )

    if simulate_invalid_action:
        recommendation_result = {
            "action": None,
            "confidence": recommendation_result.get("confidence", 0.0) if isinstance(recommendation_result, dict) else 0.0,
            "raw_response": (
                (recommendation_result.get("raw_response", "") if isinstance(recommendation_result, dict) else "")
                + " [DEMO: action overridden to invalid for fail-safe demonstration]"
            ),
        }

    recommended_action = recommendation_result.get("action") if isinstance(recommendation_result, dict) else None

    # FALLBACK 2: INVALID RECOMMENDATION
    if (
        not recommendation_result
        or not isinstance(recommendation_result, dict)
        or recommended_action is None
        or recommended_action == ""
    ):
        return log_recovery_attempt(
            db=db,
            transaction_id=transaction.id,
            ai_diagnosis=diagnosis_result["diagnosis"],
            ai_recommended_action=None,
            ai_confidence=recommendation_result.get("confidence", 0.0) if isinstance(recommendation_result, dict) else 0.0,
            ai_raw_response=recommendation_result.get("raw_response", "AI_ERROR: invalid recommendation") if isinstance(recommendation_result, dict) else "AI_ERROR: invalid recommendation",
            policy_decision="blocked",
            policy_reason=(
                "AI recommendation invalid or failed — "
                "blocked automatically (fail-safe)"
            ),
        )

    # STEP 3: POLICY CHECK
    policy_result = evaluate_policy(
        db,
        transaction,
        recommended_action,
    )

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

    # STEP 4: RAZORPAY EXECUTION
    attempt_count = (
        db.query(RecoveryAttempt)
        .filter(
            RecoveryAttempt.transaction_id == transaction.id
        )
        .count()
    )

    # Include the transaction's created_at timestamp so re-seeding the demo
    # dataset (which creates fresh rows with fresh timestamps) always
    # produces reference_ids Razorpay hasn't seen before. Razorpay enforces
    # global uniqueness on reference_id per account, independent of our
    # local DB -- resetting our SQLite DB does not reset Razorpay's memory
    # of previously created payment links.
    run_marker = int(transaction.created_at.timestamp())
    reference_id = (
        f"txn_{transaction.id}_run_{run_marker}_attempt_{attempt_count + 1}"
    )

    exec_result = create_payment_link(
        amount_inr=transaction.amount,
        email=transaction.customer_email,
        reference_id=reference_id,
    )

    payment_link_id = (
        exec_result["response"].get("id")
        if exec_result["success"]
        else None
    )


    # STEP 5: AUDIT LOG
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
        execution_status=(
            "success"
            if exec_result["success"]
            else "failed"
        ),
        razorpay_response_raw=json.dumps(
            exec_result["response"]
        ),
        payment_link_id=payment_link_id,
        amount_recovered=0.0,
    )