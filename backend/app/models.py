"""SQLAlchemy ORM models for decisions and their options."""

from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def _utcnow() -> datetime:
    """Return a timezone-aware UTC timestamp."""
    return datetime.now(timezone.utc)


class Decision(Base):
    """A question the app will decide for the user (e.g. "Where to eat?")."""

    __tablename__ = "decisions"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(120))
    description: Mapped[str | None] = mapped_column(Text, default=None)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    # Selected winner — nullable so a decision can stay open or be re-picked.
    winner_id: Mapped[int | None] = mapped_column(
        ForeignKey("options.id", ondelete="SET NULL"),
        default=None,
    )

    options: Mapped[list["Option"]] = relationship(
        back_populates="decision",
        foreign_keys="Option.decision_id",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="Option.id",
    )
    winner: Mapped["Option | None"] = relationship(
        foreign_keys=[winner_id],
        post_update=True,
    )

    @property
    def status(self) -> str:
        """'open' until the app has picked a winner, then 'decided'."""
        return "decided" if self.winner_id is not None else "open"

    @property
    def option_count(self) -> int:
        return len(self.options)


class Option(Base):
    """A single choice belonging to a decision."""

    __tablename__ = "options"

    id: Mapped[int] = mapped_column(primary_key=True)
    decision_id: Mapped[int] = mapped_column(
        ForeignKey("decisions.id", ondelete="CASCADE"),
        index=True,
    )
    label: Mapped[str] = mapped_column(String(120))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    decision: Mapped[Decision] = relationship(
        back_populates="options",
        foreign_keys=[decision_id],
    )