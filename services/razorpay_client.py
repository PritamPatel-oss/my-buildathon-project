# services/razorpay_client.py

import os
import razorpay

_client = None


def _get_client() -> razorpay.Client:
    global _client

    if _client is None:
        key_id = os.environ.get("RAZORPAY_KEY_ID")
        key_secret = os.environ.get("RAZORPAY_KEY_SECRET")

        if not key_id or not key_secret:
            from dotenv import load_dotenv
            load_dotenv()
            key_id = os.environ.get("RAZORPAY_KEY_ID")
            key_secret = os.environ.get("RAZORPAY_KEY_SECRET")

        if not key_id or not key_secret:
            raise RuntimeError(
                "RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET not set"
            )

        _client = razorpay.Client(
            auth=(key_id, key_secret)
        )

    return _client



def create_payment_link(
    amount_inr: float,
    email: str,
    reference_id: str
) -> dict:
    """
    Creates a Razorpay test-mode Payment Link
    and returns {success, response}.

    Amount is converted from INR to paise.
    """

    try:
        client = _get_client()

        payload = {
            "amount": int(amount_inr * 100),
            "currency": "INR",
            "reference_id": reference_id,
            "description": "RecoverAI: payment recovery link",
            "customer": {
                "email": email
            },
            "notify": {
                "sms": False,
                "email": True
            },
            "reminder_enable": True,
        }

        response = client.payment_link.create(payload)

        return {
            "success": True,
            "response": response
        }

    except Exception as e:
        return {
            "success": False,
            "response": {
                "error": str(e)
            }
        }


def fetch_payment_link(payment_link_id: str) -> dict:
    """
    Fetches the current status of a Razorpay Payment Link.
    """

    try:
        client = _get_client()

        response = client.payment_link.fetch(
            payment_link_id
        )

        return {
            "success": True,
            "response": response
        }

    except Exception as e:
        return {
            "success": False,
            "response": {
                "error": str(e)
            }
        }