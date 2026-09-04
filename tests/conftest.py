# tests/conftest.py
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from db.models import Base, User
from main import app
from routers.transactions import get_db as txn_get_db
from services.auth import get_db as auth_get_db, get_current_user

TEST_DATABASE_URL = "sqlite:///:memory:"


@pytest.fixture()
def db_session():
    engine = create_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(bind=engine)
    session = TestingSessionLocal()
    yield session
    session.close()
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client(db_session):
    test_user = User(id=1, email="test@recoverai.com", hashed_password="fake_hashed_password")
    db_session.add(test_user)
    db_session.commit()
    db_session.refresh(test_user)

    def override_get_db():
        try:
            yield db_session
        finally:
            pass  # fixture owns closing the session

    def override_get_current_user():
        return test_user

    app.dependency_overrides[txn_get_db] = override_get_db
    app.dependency_overrides[auth_get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


