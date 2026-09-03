# services/ai_recommendation.py

from services.policy_engine import ALLOWED_ACTIONS


def recommend_action(diagnosis: str, amount: float) -> dict:
    """
    Local deterministic recovery recommendation engine.

    No external API or API key is required.
    Returns the same response structure expected by the
    recovery orchestrator.
    """

    diagnosis = (diagnosis or "").strip().lower()

    # Currently the policy engine allows only this action.
    if diagnosis in [
        "insufficient_funds",
        "card_expired",
        "bank_declined",
        "payment_timeout",
        "invalid_otp",
        "network_error",
    ]:
        action = "resend_payment_link"
        confidence = 0.95
        reason = f"Recovery link recommended for {diagnosis}."

    else:
        # Unknown diagnosis should not automatically trigger recovery.
        return {
            "action": None,
            "confidence": 0.0,
            "raw_response": (
                f"LOCAL_RECOMMENDATION: no safe action for diagnosis '{diagnosis}'"
            ),
        }

    # Final safety check against the policy engine's allowed actions.
    if action not in ALLOWED_ACTIONS:
        return {
            "action": None,
            "confidence": 0.0,
            "raw_response": (
                f"LOCAL_RECOMMENDATION: action '{action}' is not allowed"
            ),
        }

    return {
        "action": action,
        "confidence": confidence,
        "raw_response": (
            f"LOCAL_RECOMMENDATION: {action} | {reason}"
        ),
    }