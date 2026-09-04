# db/models.py
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import declarative_base
from datetime import datetime, timezone

Base = declarative_base()


def _utcnow():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=_utcnow)


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # merchant/user owner
    razorpay_payment_id = Column(String, nullable=True)  # filled after real API call
    customer_email = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String, default="INR")
    status = Column(String, nullable=False)  # created, failed, pending, recovered, lost
    failure_reason_raw = Column(String, nullable=True)  # raw gateway error, if any
    created_at = Column(DateTime, default=_utcnow)



class RecoveryAttempt(Base):
    __tablename__ = "recovery_attempts"

    id = Column(Integer, primary_key=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=False)

    # Diagnosis stage
    ai_diagnosis = Column(String, nullable=True)
    ai_recommended_action = Column(String, nullable=True)
    ai_confidence = Column(Float, nullable=True)
    ai_raw_response = Column(String, nullable=True)  # full raw string for debugging/audit

    # Policy stage
    policy_decision = Column(String, nullable=False)  # allowed, blocked
    policy_reason = Column(String, nullable=True)

    # Execution stage
    action_taken = Column(String, nullable=True)
    execution_status = Column(String, nullable=True)  # success, failed, skipped
    razorpay_response_raw = Column(String, nullable=True)
    payment_link_id = Column(String, nullable=True)

    amount_recovered = Column(Float, default=0.0)
    created_at = Column(DateTime, default=_utcnow)
