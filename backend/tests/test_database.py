"""Tests for database initialization, sessions, and foreign-key enforcement."""

import pytest
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import (
    Base,
    SessionLocal,
    engine,
    get_db,
    init_db,
)
from app.models import Decision, Option


def test_metadata_declares_both_tables():
    tables = set(Base.metadata.tables)
    assert {"decisions", "options"} <= tables


def test_init_db_creates_tables_on_explicit_engine(tmp_path):
    engine = create_engine(f"sqlite:///{tmp_path / 'init.db'}")
    try:
        init_db(target_engine=engine)
        inspector = inspect(engine)
        assert {"decisions", "options"} <= set(inspector.get_table_names())
    finally:
        engine.dispose()


def test_init_db_is_idempotent(tmp_path):
    engine = create_engine(f"sqlite:///{tmp_path / 'init.db'}")
    try:
        init_db(target_engine=engine)
        init_db(target_engine=engine)  # Second run must not raise.
        assert "decisions" in inspect(engine).get_table_names()
    finally:
        engine.dispose()


def test_init_db_defaults_to_app_engine():
    # The app engine points at the session temp DB (see conftest), never at a
    # developer's real local database.
    init_db()
    assert "decisions" in inspect(engine).get_table_names()


def test_app_engine_enforces_foreign_keys():
    """Force the default engine to reject orphaned options (PRAGMA foreign_keys)."""
    init_db()
    session = SessionLocal()
    try:
        session.add(Option(label="orphan", decision_id=999_999))
        with pytest.raises(IntegrityError):
            session.flush()
        session.rollback()
    finally:
        session.close()


def test_get_db_yields_session_and_closes():
    generator = get_db()
    session = next(generator)
    assert isinstance(session, Session)
    session.execute(text("SELECT 1"))  # Session is usable.

    original_close = session.close
    closed = False

    def tracked_close():
        nonlocal closed
        closed = True
        original_close()

    session.close = tracked_close  # type: ignore[method-assign]
    generator.close()

    assert closed is True