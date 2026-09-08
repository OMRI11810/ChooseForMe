"""CRUD + "decide for me" endpoints for decision queues."""

import random

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models import Decision, Option
from app.schemas import (
    DecisionCreate,
    DecisionOut,
    DecisionSummaryOut,
    DecisionUpdate,
    OptionAdd,
    OptionOut,
    OptionUpdate,
    PickOut,
)

router = APIRouter(prefix="/decisions", tags=["decisions"])

MAX_OPTIONS_PER_DECISION = 30
MIN_OPTIONS_PER_DECISION = 2


def _get_decision_or_404(db: Session, decision_id: int) -> Decision:
    """Fetch a decision with its options preloaded, else raise 404."""
    decision = db.get(Decision, decision_id, options=[selectinload(Decision.options)])
    if decision is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Decision not found")
    return decision


def _get_option_or_404(db: Session, decision_id: int, option_id: int) -> Option:
    """Fetch an option that belongs to the given decision, else raise 404.

    A plain 404 is returned even for an existing option owned by a different
    decision so that option ids from other decisions are not leaked.
    """
    option = db.get(Option, option_id)
    if option is None or option.decision_id != decision_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Option not found in this decision",
        )
    return option


def _raise_duplicate_label() -> None:
    """400 error used whenever an option label already exists on the decision."""
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="An option with that label already exists",
    )


@router.post("", response_model=DecisionOut, status_code=status.HTTP_201_CREATED)
def create_decision(payload: DecisionCreate, db: Session = Depends(get_db)) -> Decision:
    """Create a decision along with at least two options."""
    decision = Decision(title=payload.title, description=payload.description)
    decision.options = [Option(label=option.label) for option in payload.options]
    db.add(decision)
    db.commit()
    db.refresh(decision)
    return decision


@router.get("", response_model=list[DecisionSummaryOut])
def list_decisions(db: Session = Depends(get_db)) -> list[Decision]:
    """List all decisions, newest first."""
    decisions = db.scalars(
        select(Decision)
        .options(selectinload(Decision.options))
        .order_by(Decision.created_at.desc(), Decision.id.desc())
    ).all()
    return list(decisions)


@router.get("/{decision_id}", response_model=DecisionOut)
def get_decision(decision_id: int, db: Session = Depends(get_db)) -> Decision:
    """Return a single decision with its options and winner."""
    return _get_decision_or_404(db, decision_id)


@router.patch("/{decision_id}", response_model=DecisionOut)
def update_decision(
    decision_id: int,
    payload: DecisionUpdate,
    db: Session = Depends(get_db),
) -> Decision:
    """Update a decision's title and/or description (PATCH semantics).

    Only the fields explicitly included in the request are changed. Sending
    `{"description": null}` clears the description; sending an empty object
    (`{}`) is a no-op that still returns the current state.
    """
    decision = _get_decision_or_404(db, decision_id)
    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(decision, field, value)
    db.commit()
    db.refresh(decision)
    return decision


@router.delete("/{decision_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_decision(decision_id: int, db: Session = Depends(get_db)) -> Response:
    """Delete a decision and all of its options."""
    decision = _get_decision_or_404(db, decision_id)
    db.delete(decision)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{decision_id}/options", response_model=DecisionOut)
def add_option(decision_id: int, payload: OptionAdd, db: Session = Depends(get_db)) -> Decision:
    """Append an option to an existing decision."""
    decision = _get_decision_or_404(db, decision_id)
    if len(decision.options) >= MAX_OPTIONS_PER_DECISION:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A decision can have at most {MAX_OPTIONS_PER_DECISION} options",
        )
    if any(option.label.casefold() == payload.label.casefold() for option in decision.options):
        _raise_duplicate_label()
    decision.options.append(Option(label=payload.label))
    db.commit()
    db.refresh(decision)
    return decision


@router.patch("/{decision_id}/options/{option_id}", response_model=DecisionOut)
def update_option(
    decision_id: int,
    option_id: int,
    payload: OptionUpdate,
    db: Session = Depends(get_db),
) -> Decision:
    """Rename an existing option."""
    decision = _get_decision_or_404(db, decision_id)
    option = _get_option_or_404(db, decision_id, option_id)
    new_label = payload.label
    if any(
        other.label.casefold() == new_label.casefold() and other.id != option.id
        for other in decision.options
    ):
        _raise_duplicate_label()
    option.label = new_label
    db.commit()
    db.refresh(decision)
    return decision


@router.delete("/{decision_id}/options/{option_id}", response_model=DecisionOut)
def remove_option(
    decision_id: int,
    option_id: int,
    db: Session = Depends(get_db),
) -> Decision:
    """Remove an option, keeping the decision valid (min two options)."""
    decision = _get_decision_or_404(db, decision_id)
    option = _get_option_or_404(db, decision_id, option_id)
    if len(decision.options) <= MIN_OPTIONS_PER_DECISION:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A decision needs at least two options",
        )
    db.delete(option)
    db.commit()
    db.refresh(decision)
    return decision


@router.post("/{decision_id}/pick", response_model=PickOut)
def pick_winner(decision_id: int, db: Session = Depends(get_db)) -> PickOut:
    """Randomly choose one of the decision's options and mark it as the winner.

    Calling this again re-picks and replaces the previous winner.
    """
    decision = _get_decision_or_404(db, decision_id)
    if not decision.options:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No options to decide between",
        )
    winner = random.choice(decision.options)
    decision.winner_id = winner.id
    db.commit()
    db.refresh(winner)
    return PickOut(decision_id=decision.id, winner=OptionOut.model_validate(winner))


@router.delete("/{decision_id}/winner", response_model=DecisionOut)
def clear_winner(decision_id: int, db: Session = Depends(get_db)) -> Decision:
    """Reset a decided decision back to 'open' (clears the winner)."""
    decision = _get_decision_or_404(db, decision_id)
    decision.winner_id = None
    db.commit()
    db.refresh(decision)
    return decision