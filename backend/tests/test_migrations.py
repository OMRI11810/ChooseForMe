"""Tests for the Alembic migration chain (upgrade / downgrade / schema parity)."""

from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from alembic.script import ScriptDirectory
from sqlalchemy import create_engine, inspect

from app.config import settings

BACKEND_DIR = Path(__file__).resolve().parents[1]

SCHEMA_COLUMNS = {
    "decisions": {
        "id": (False, "INTEGER"),
        "title": (False, "VARCHAR(120)"),
        "description": (True, "TEXT"),
        "created_at": (False, "DATETIME"),
        "winner_id": (True, "INTEGER"),
    },
    "options": {
        "id": (False, "INTEGER"),
        "decision_id": (False, "INTEGER"),
        "label": (False, "VARCHAR(120)"),
        "created_at": (False, "DATETIME"),
    },
}


@pytest.fixture()
def alembic_environment(tmp_path, monkeypatch):
    """Alembic config pointed at an isolated, empty SQLite database."""
    db_url = f"sqlite:///{tmp_path / 'migrated.db'}"
    monkeypatch.setattr(settings, "database_url", db_url)

    config = Config(str(BACKEND_DIR / "alembic.ini"))
    config.set_main_option("script_location", str(BACKEND_DIR / "migrations"))
    config.set_main_option("sqlalchemy.url", db_url)
    return config, db_url


def _inspect(db_url):
    engine = create_engine(db_url)
    try:
        return inspect(engine)
    finally:
        engine.dispose()


def test_single_head_revision(alembic_environment):
    config, _ = alembic_environment
    script = ScriptDirectory.from_config(config)
    heads = script.get_heads()
    assert len(heads) == 1


def test_initial_revision_has_no_down_revision(alembic_environment):
    config, _ = alembic_environment
    script = ScriptDirectory.from_config(config)
    walk = list(script.walk_revisions())
    assert len(walk) == 1
    assert walk[0].down_revision is None


def test_upgrade_head_creates_expected_schema(alembic_environment):
    config, db_url = alembic_environment
    command.upgrade(config, "head")

    inspector = _inspect(db_url)
    tables = set(inspector.get_table_names())
    assert {"decisions", "options", "alembic_version"} <= tables

    # Every column the models declare must exist with the right nullability.
    for table, expected in SCHEMA_COLUMNS.items():
        columns = {c["name"]: c for c in inspector.get_columns(table)}
        assert set(columns) == set(expected)
        for name, (nullable, _type) in expected.items():
            assert columns[name]["nullable"] is nullable, f"{table}.{name}"

    # Foreign keys, including the "self-referential" winner link across tables.
    decisions_fks = inspector.get_foreign_keys("decisions")
    assert any(
        fk["constrained_columns"] == ["winner_id"] and fk["referred_table"] == "options"
        for fk in decisions_fks
    )
    options_fks = inspector.get_foreign_keys("options")
    assert any(
        fk["constrained_columns"] == ["decision_id"] and fk["referred_table"] == "decisions"
        for fk in options_fks
    )

    # The index that backs the options.decision_id foreign key.
    options_indexes = inspector.get_indexes("options")
    assert any(i.get("column_names") == ["decision_id"] for i in options_indexes)


def test_downgrade_base_removes_schema(alembic_environment):
    config, db_url = alembic_environment
    command.upgrade(config, "head")
    command.downgrade(config, "base")

    inspector = _inspect(db_url)
    tables = set(inspector.get_table_names())
    assert "decisions" not in tables
    assert "options" not in tables


def test_upgrade_is_idempotent(alembic_environment):
    config, db_url = alembic_environment
    command.upgrade(config, "head")
    command.upgrade(config, "head")  # No-op on an up-to-date database.

    inspector = _inspect(db_url)
    assert "decisions" in inspector.get_table_names()


def test_migrated_schema_matches_model_metadata(alembic_environment):
    """Alembic-generated schema and ORM metadata must describe the same tables."""
    config, db_url = alembic_environment
    command.upgrade(config, "head")

    from app.database import Base
    from app import models  # noqa: F401

    inspector = _inspect(db_url)
    model_tables = set(Base.metadata.tables)
    db_tables = {t for t in inspector.get_table_names() if t != "alembic_version"}
    assert model_tables == db_tables

    for table_name in model_tables:
        model_columns = {
            c.name for c in Base.metadata.tables[table_name].columns
        }
        db_columns = {c["name"] for c in inspector.get_columns(table_name)}
        assert model_columns == db_columns