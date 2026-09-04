"""SQLAlchemy engine, session management, and declarative base."""

from collections.abc import Generator

from sqlalchemy import Engine, create_engine, event
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import settings


class Base(DeclarativeBase):
    """Declarative base for all ORM models."""


engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False},  # Required for SQLite + FastAPI threads.
    echo=settings.debug and False,  # Flip to True for SQL logging during development.
)


def enable_sqlite_foreign_keys(dbapi_connection, _connection_record) -> None:
    """Enforce foreign-key constraints (off by default in SQLite).

    Exposed as a standalone helper so tests can apply the same behavior to
    their own (in-memory) engines.
    """
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


@event.listens_for(engine, "connect")
def _set_sqlite_pragma(dbapi_connection, _connection_record) -> None:
    enable_sqlite_foreign_keys(dbapi_connection, _connection_record)


SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)


def init_db(target_engine: Engine | None = None) -> None:
    """Create all tables for a fresh database (idempotent).

    Intended for development and test use; schema changes in deployed
    environments should go through Alembic migrations instead.
    """
    bind = target_engine if target_engine is not None else engine
    Base.metadata.create_all(bind=bind)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that yields a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()