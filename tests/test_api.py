# tests/test_api.py
from db.models import Transaction


def seed_one(db, **overrides):
    defaults = dict(customer_email="api@x.com", amount=500.0,
                     status="failed", failure_reason_raw="card_expired")
    defaults.update(overrides)
    txn = Transaction(**defaults)
    db.add(txn)
    db.commit()
    db.refresh(txn)
    return txn


def test_list_transactions(client, db_session):
    seed_one(db_session)
    res = client.get("/transactions/")
    assert res.status_code == 200
    assert len(res.json()) == 1


def test_at_risk_endpoint(client, db_session):
    seed_one(db_session, amount=1000.0)
    seed_one(db_session, amount=2000.0, status="recovered")  # excluded
    res = client.get("/transactions/risk/at-risk")
    assert res.status_code == 200
    assert res.json()["total_at_risk"] == 1000.0


def test_404_on_missing_transaction(client):
    res = client.get("/transactions/9999")
    assert res.status_code == 404


def test_audit_trail_empty_for_new_transaction(client, db_session):
    txn = seed_one(db_session)
    res = client.get(f"/transactions/{txn.id}/audit-trail")
    assert res.status_code == 200
    assert res.json() == []


def test_global_audit_log_returns_all_attempts(client, db_session, monkeypatch):
    import services.recovery_orchestrator as orch
    monkeypatch.setattr(orch, "diagnose_transaction", lambda *a, **k: {
        "diagnosis": "card_expired", "confidence": 0.8, "raw_response": "{}",
    })
    monkeypatch.setattr(orch, "recommend_action", lambda *a, **k: {
        "action": "resend_payment_link", "confidence": 0.8, "raw_response": "{}",
    })
    monkeypatch.setattr(orch, "create_payment_link", lambda *a, **k: {
        "success": True, "response": {"id": "plink_z"},
    })
    txn = seed_one(db_session)
    client.post(f"/transactions/{txn.id}/process-recovery")

    res = client.get("/transactions/audit/all")
    assert res.status_code == 200
    body = res.json()
    assert len(body) == 1
    assert body[0]["customer_email"] == "api@x.com"


def test_metrics_summary_shape(client, db_session):
    seed_one(db_session, amount=1000.0)
    res = client.get("/transactions/metrics/summary")
    assert res.status_code == 200
    body = res.json()
    assert set(body.keys()) == {"total_recovered", "total_at_risk", "recovery_rate_pct"}
