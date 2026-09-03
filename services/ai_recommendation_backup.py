# services/ai_recommendation.py
import os
import json
import anthropic
from services.policy_engine import ALLOWED_ACTIONS

_client = None


def _get_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            raise RuntimeError("ANTHROPIC_API_KEY environment variable not set")
        _client = anthropic.Anthropic(api_key=api_key)
    return _client


def recommend_action(diagnosis: str, amount: float) -> dict:
    """
    Calls Claude to recommend a recovery action, constrained to ALLOWED_ACTIONS.
    Returns: {"action": str, "confidence": float, "raw_response": str}
    On any failure, returns action=None (caller must handle fallback).
    """
    prompt = f"""A payment failed with diagnosis: "{diagnosis}"
Transaction amount: {amount} INR

Choose exactly ONE recovery action from this list:
{", ".join(ALLOWED_ACTIONS)}

Respond with ONLY valid JSON, no other text:
{{"action": "<action>", "confidence": <0.0 to 1.0>, "reasoning": "<short reason>"}}"""

    try:
        client = _get_client()
        response = client.messages.create(
            model="claude-haiku-4-5",
            max_tokens=200,
            messages=[{"role": "user", "content": prompt}],
        )
        raw_text = response.content[0].text.strip()
        parsed = json.loads(raw_text)

        action = parsed.get("action")
        if action not in ALLOWED_ACTIONS:
            action = None  # invalid AI output, caller falls back

        return {
            "action": action,
            "confidence": float(parsed.get("confidence", 0.0)),
            "raw_response": raw_text,
        }

    except Exception as e:
        return {
            "action": None,
            "confidence": 0.0,
            "raw_response": f"AI_ERROR: {str(e)}",
        }
