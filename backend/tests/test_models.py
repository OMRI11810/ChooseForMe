"""Tests for the Decision and Option ORM models."""

import pytest
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.models import Decision, Option


def test_create_decision_with_options(db_session):
    decision = Decision(title="Where to eat?", description="dinner with friends")
    decision.options = [Option(label="Sushi"), Option(label="Pizza")]
    db_session.add(decision)
    db_session.commit()

    saved = db_session.get(Decision, decision.id)
    assert saved is not None
    assert saved.id == decision.id
    assert saved.title == "Where to eat?"
    assert saved.description == "dinner with friends"
    assert saved.created_at is not None
    # Options persisted in insertion order, with the back-reference intact.
    assert [option.label for option in saved.options] == ["Sushi", "Pizza"]
    assert all(option.decision is saved for option in saved.options)


def test_options_default_to_insertion_order(db_session):
    decision = Decision(title="Pick a movie")
    decision.options = [Option(label="C"), Option(label="A"), Option(label="B")]
    db_session.add(decision)
    db_session.commit()

    saved = db_session.get(Decision, decision.id)
    assert [option.label for option in saved.options] == ["C", "A", "B"]


def test_description_is_optional(db_session):
    decision = Decision(title="No description")
    decision.options = [Option(label="Yes"), Option(label="No")]
    db_session.add(decision)
    db_session.commit()

    assert db_session.get(Decision, decision.id).description is None


def test_status_defaults_to_open_and_flips_to_decided(db_session):
    decision = Decision(title="Coffee or tea?")
    winner = Option(label="Coffee")
    decision.options = [winner, Option(label="Tea")]
    db_session.add(decision)
    db_session.commit()

    assert decision.status == "open"
    assert decision.winner is None
    assert decision.winner_id is None

    decision.winner = winner
    db_session.commit()
    db_session.refresh(decision)

    assert decision.status == "decided"
    assert decision.winner_id == winner.id
    assert decision.winner is not None
    assert decision.winner.label == "Coffee"


def test_repicking_replaces_winner(db_session):
    decision = Decision(title="Dessert?")
    first, second = Option(label="Ice cream"), Option(label="Cake")
    decision.options = [first, second, Option(label="Fruit")]
    db_session.add(decision)
    db_session.commit()

    decision.winner = first
    db_session.commit()
    assert decision.winner_id == first.id

    decision.winner = second
    db_session.commit()
    db_session.refresh(decision)

    assert decision.winner_id == second.id
    assert decision.status == "decided"


def test_option_count_reflects_collection_size(db_session):
    decision = Decision(title="Mode of transport")
    decision.options = [Option(label="Bike"), Option(label="Bus"), Option(label="Car")]
    db_session.add(decision)
    db_session.commit()

    assert decision.option_count == 3

    decision.options.append(Option(label="Train"))
    db_session.commit()
    assert decision.option_count == 4


def test_cascade_delete_removes_options(db_session):
    decision = Decision(title="Delete me")
    decision.options = [Option(label="A"), Option(label="B")]
    db_session.add(decision)
    db_session.commit()

    decision_id = decision.id
    db_session.delete(decision)
    db_session.commit()

    assert db_session.get(Decision, decision_id) is None
    remaining = db_session.scalars(select(Option)).all()
    assert remaining == []


def test_deleting_winner_option_clears_winner(db_session):
    decision = Decision(title="Movie night?")
    winner = Option(label="Action")
    decision.options = [winner, Option(label="Comedy"), Option(label="Drama")]
    db_session.add(decision)
    db_session.commit()

    decision.winner = winner
    db_session.commit()
    assert decision.winner_id == winner.id

    db_session.delete(winner)
    db_session.commit()

    # expire_on_commit=False keeps the in-memory copy stale, so re-read from
    # the database to assert the persisted state (FK ON DELETE SET NULL).
    db_session.expire_all()
    saved = db_session.get(Decision, decision.id)
    assert saved.winner_id is None
    assert saved.winner is None
    assert saved.status == "open"
    assert [option.label for option in saved.options] == ["Comedy", "Drama"]


def test_missing_required_title_raises_integrity_error(db_session):
    db_session.add(Decision())
    with pytest.raises(IntegrityError):
        db_session.flush()
    db_session.rollback()


def test_missing_option_label_raises_integrity_error(db_session):
    decision = Decision(title="Needs labels")
    decision.options = [Option()]
    db_session.add(decision)
    with pytest.raises(IntegrityError):
        db_session.flush()
    db_session.rollback()