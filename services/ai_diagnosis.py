# services/ai_diagnosis.py

DIAGNOSIS_CATEGORIES = [
    "insufficient_funds",
    "card_expired",
    "bank_declined",
    "payment_timeout",
    "invalid_otp",
    "network_error",
    "unknown",
]


def diagnose_transaction(failure_reason_raw: str, amount: float) -> dict:
    """
    Local deterministic diagnosis engine.

    No external API or API key is required.
    Returns the same response structure expected by the
    recovery orchestrator.
    """
    try:
        reason = (failure_reason_raw or "").strip().lower()

        # Direct/known gateway reasons
        if "insufficient" in reason or "insufficient_funds" in reason:
            diagnosis = "insufficient_funds"

        elif "expired" in reason or "card_expired" in reason:
            diagnosis = "card_expired"

        elif "bank" in reason and "declin" in reason:
            diagnosis = "bank_declined"

        elif "timeout" in reason or "timed_out" in reason:
            diagnosis = "payment_timeout"

        elif "otp" in reason:
            diagnosis = "invalid_otp"

        elif (
            "network" in reason
            or "connection" in reason
            or "connectivity" in reason
        ):
            diagnosis = "network_error"

        elif "declin" in reason:
            diagnosis = "bank_declined"

        else:
            diagnosis = "unknown"

        return {
            "diagnosis": diagnosis,
            "confidence": 0.95 if diagnosis != "unknown" else 0.50,
            "raw_response": (
                f"LOCAL_DIAGNOSIS: classified '{failure_reason_raw}' "
                f"as '{diagnosis}'"
            ),
        }
    except Exception as e:
        return {
            "diagnosis": "unknown",
            "confidence": 0.0,
            "raw_response": f"AI_ERROR: {str(e)}",
        }