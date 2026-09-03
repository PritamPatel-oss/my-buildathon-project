# tests/test_orchestrator.py
from db.models import Transaction
import services.recovery_orchestrator as orch


def make_txn(db, **overrides):
    defaults = dict(customer_email="test@x.com", amount=1000.0,
                     status="failed", failure_reason_raw="insufficient_funds")
    defaults.update(overrides)
    txn = Transaction(**defaults)
    db.add(txn)
    db.commit()
    db.refresh(txn)
    return txn


def test_ai_diagnosis_failure_blocks_safely(db_session, monkeypatch):
    monkeypatch.setattr(orch, "diagnose_transaction", lambda *a, **k: {
        "diagnosis": "unknown", "confidence": 0.0,
        "raw_response": "AI_ERROR: simulated outage",
    })
    txn = make_txn(db_session)
    attempt = orch.process_recovery(db_session, txn)
    assert attempt.policy_decision == "blocked"
    assert "AI diagnosis failed" in attempt.policy_reason
    assert attempt.execution_status is None  # never reached Razorpay


def test_invalid_ai_action_blocks_safely(db_session, monkeypatch):
    monkeypatch.setattr(orch, "diagnose_transaction", lambda *a, **k: {
        "diagnosis": "card_expired", "confidence": 0.7, "raw_response": "{}",
    })
    monkeypatch.setattr(orch, "recommend_action", lambda *a, **k: {
        "action": None, "confidence": 0.0, "raw_response": "off-list action",
    })
    txn = make_txn(db_session)
    attempt = orch.process_recovery(db_session, txn)
    assert attempt.policy_decision == "blocked"
    assert "recommendation invalid" in attempt.policy_reason


def test_policy_block_stops_before_execution(db_session, monkeypatch):
    monkeypatch.setattr(orch, "diagnose_transaction", lambda *a, **k: {
        "diagnosis": "card_expired", "confidence": 0.9, "raw_response": "{}",
    })
    monkeypatch.setattr(orch, "recommend_action", lambda *a, **k: {
        "action": "resend_payment_link", "confidence": 0.9, "raw_response": "{}",
    })
    called = {"razorpay": False}

    def fake_create_link(*a, **k):
        called["razorpay"] = True
        return {"success": True, "response": {"id": "plink_x"}}

    monkeypatch.setattr(orch, "create_payment_link", fake_create_link)

    # over the amount cap -> policy blocks -> Razorpay must never be called
    txn = make_txn(db_session, amount=999999.0)
    attempt = orch.process_recovery(db_session, txn)
    assert attempt.policy_decision == "blocked"
    assert called["razorpay"] is False


def test_happy_path_executes_and_logs(db_session, monkeypatch):
    monkeypatch.setattr(orch, "diagnose_transaction", lambda *a, **k: {
        "diagnosis": "insufficient_funds", "confidence": 0.9, "raw_response": "{}",
    })
    monkeypatch.setattr(orch, "recommend_action", lambda *a, **k: {
        "action": "resend_payment_link", "confidence": 0.9, "raw_response": "{}",
    })
    monkeypatch.setattr(orch, "create_payment_link", lambda *a, **k: {
        "success": True, "response": {"id": "plink_demo123", "status": "created"},
    })
    txn = make_txn(db_session)
    attempt = orch.process_recovery(db_session, txn)
    assert attempt.policy_decision == "allowed"
    assert attempt.execution_status == "success"
    assert attempt.payment_link_id == "plink_demo123"


def test_duplicate_retry_prevented_across_two_calls(db_session, monkeypatch):
    monkeypatch.setattr(orch, "diagnose_transaction", lambda *a, **k: {
        "diagnosis": "insufficient_funds", "confidence": 0.9, "raw_response": "{}",
    })
    monkeypatch.setattr(orch, "recommend_action", lambda *a, **k: {
        "action": "resend_payment_link", "confidence": 0.9, "raw_response": "{}",
    })
    monkeypatch.setattr(orch, "create_payment_link", lambda *a, **k: {
        "success": True, "response": {"id": "plink_1", "status": "created"},
    })
    txn = make_txn(db_session)

    first = orch.process_recovery(db_session, txn)
    assert first.execution_status == "success"

    second = orch.process_recovery(db_session, txn)
    assert second.policy_decision == "blocked"
    assert "Duplicate" in second.policy_reason
