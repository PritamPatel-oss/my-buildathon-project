# tests/test_policy_engine.py
from db.models import Transaction, RecoveryAttempt
from services.policy_engine import evaluate_policy, MAX_RECOVERABLE_AMOUNT, MAX_RETRY_ATTEMPTS


def make_txn(db, **overrides):
    defaults = dict(customer_email="test@x.com", amount=1000.0, status="failed")
    defaults.update(overrides)
    txn = Transaction(**defaults)
    db.add(txn)
    db.commit()
    db.refresh(txn)
    return txn


def test_allows_valid_transaction(db_session):
    txn = make_txn(db_session)
    result = evaluate_policy(db_session, txn, "resend_payment_link")
    assert result["decision"] == "allowed"


def test_blocks_ineligible_status(db_session):
    txn = make_txn(db_session, status="recovered")
    result = evaluate_policy(db_session, txn, "resend_payment_link")
    assert result["decision"] == "blocked"
    assert "not eligible" in result["reason"]


def test_blocks_action_not_on_allowlist(db_session):
    txn = make_txn(db_session)
    result = evaluate_policy(db_session, txn, "issue_refund")  # not in ALLOWED_ACTIONS
    assert result["decision"] == "blocked"
    assert "not in allowed action list" in result["reason"]


def test_blocks_over_amount_cap(db_session):
    txn = make_txn(db_session, amount=MAX_RECOVERABLE_AMOUNT + 1)
    result = evaluate_policy(db_session, txn, "resend_payment_link")
    assert result["decision"] == "blocked"
    assert "exceeds cap" in result["reason"]


def test_blocks_duplicate_after_success(db_session):
    txn = make_txn(db_session)
    db_session.add(RecoveryAttempt(
        transaction_id=txn.id, policy_decision="allowed",
        policy_reason="ok", execution_status="success",
    ))
    db_session.commit()
    result = evaluate_policy(db_session, txn, "resend_payment_link")
    assert result["decision"] == "blocked"
    assert "Duplicate" in result["reason"]


def test_blocks_after_retry_limit(db_session):
    txn = make_txn(db_session)
    for _ in range(MAX_RETRY_ATTEMPTS):
        db_session.add(RecoveryAttempt(
            transaction_id=txn.id, policy_decision="allowed",
            policy_reason="ok", execution_status="failed",
        ))
    db_session.commit()
    result = evaluate_policy(db_session, txn, "resend_payment_link")
    assert result["decision"] == "blocked"
    assert "Retry limit" in result["reason"]


def test_allows_up_to_but_not_over_retry_limit(db_session):
    txn = make_txn(db_session)
    for _ in range(MAX_RETRY_ATTEMPTS - 1):
        db_session.add(RecoveryAttempt(
            transaction_id=txn.id, policy_decision="allowed",
            policy_reason="ok", execution_status="failed",
        ))
    db_session.commit()
    result = evaluate_policy(db_session, txn, "resend_payment_link")
    assert result["decision"] == "allowed"
