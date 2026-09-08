"""Shared pytest fixtures and environment bootstrap for the backend test suite."""

import os
import sys
import tempfile
from pathlib import Path

import pytest

# Make the `app` package importable no matter where pytest is invoked from.
BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

# Point the real app engine at a throwaway database BEFORE importing any app
# module, so the test run never touches the developer's local chooseforme.db.
_SESSION_DB = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
_SESSION_DB.close()
os.environ["CHOOSEFORME_DATABASE_URL"] = f"sqlite:///{_SESSION_DB.name}"

from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine, event  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

from app.database import Base, enable_sqlite_foreign_keys, get_db  # noqa: E402
from app.main import app  # noqa: E402


def pytest_sessionfinish(session, exitstatus) -> None:
    """Remove the throwaway database file after the whole run."""
    try:
        os.remove(_SESSION_DB.name)
    except OSError:
        pass


def _session_factory(bind) -> sessionmaker:
    return sessionmaker(bind=bind, autoflush=False, autocommit=False, expire_on_commit=False)


@pytest.fixture()
def db_engine():
    """A fresh in-memory SQLite engine with the full model schema, per test."""
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,  # Share one connection so the in-memory DB persists.
    )
    event.listen(engine, "connect", enable_sqlite_foreign_keys)
    Base.metadata.create_all(bind=engine)
    yield engine
    engine.dispose()


@pytest.fixture()
def db_session(db_engine):
    """A standalone ORM session bound to the per-test database."""
    session = _session_factory(db_engine)()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def client(db_engine):
    """TestClient whose requests hit an isolated in-memory database.

    The app's own `get_db` dependency is overridden per test so each test
    starts from a clean schema. The default lifespan (init_db) only touches
    the throwaway session database, never a real local DB.
    """
    factory = _session_factory(db_engine)

    def override_get_db():
        session = factory()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()