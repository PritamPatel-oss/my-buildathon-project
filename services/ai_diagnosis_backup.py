# services/ai_diagnosis.py
import os
import json
import anthropic

DIAGNOSIS_CATEGORIES = [
    "insufficient_funds",
    "card_expired",
    "bank_declined",
    "payment_timeout",
    "invalid_otp",
    "network_error",
    "unknown",
]

_client = None


def _get_client() -> anthropic.Anthropic:
    # Lazy init: missing key surfaces as a caught exception -> AI_ERROR fallback,
    # not a crash at import time. Keeps the module importable (and testable) with no key set.
    global _client
    if _client is None:
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            raise RuntimeError("ANTHROPIC_API_KEY environment variable not set")
        _client = anthropic.Anthropic(api_key=api_key)
    return _client


def diagnose_transaction(failure_reason_raw: str, amount: float) -> dict:
    """
    Calls Claude to diagnose the failure reason.
    Returns: {"diagnosis": str, "confidence": float, "raw_response": str}
    On any failure, returns diagnosis='unknown', confidence=0.0,
    raw_response starting with 'AI_ERROR:' (this prefix is load-bearing —
    the orchestrator checks it to trigger the fail-safe path).
    """
    prompt = f"""A payment failed with this raw gateway reason: "{failure_reason_raw}"
Transaction amount: {amount} INR

Classify the failure into exactly one of these categories:
{", ".join(DIAGNOSIS_CATEGORIES)}

Respond with ONLY valid JSON, no other text:
{{"diagnosis": "<category>", "confidence": <0.0 to 1.0>}}"""

    try:
        client = _get_client()
        response = client.messages.create(
            model="claude-haiku-4-5",
            max_tokens=200,
            messages=[{"role": "user", "content": prompt}],
        )
        raw_text = response.content[0].text.strip()
        parsed = json.loads(raw_text)

        diagnosis = parsed.get("diagnosis", "unknown")
        if diagnosis not in DIAGNOSIS_CATEGORIES:
            diagnosis = "unknown"

        return {
            "diagnosis": diagnosis,
            "confidence": float(parsed.get("confidence", 0.0)),
            "raw_response": raw_text,
        }

    except Exception as e:
        return {
            "diagnosis": "unknown",
            "confidence": 0.0,
            "raw_response": f"AI_ERROR: {str(e)}",
        }
