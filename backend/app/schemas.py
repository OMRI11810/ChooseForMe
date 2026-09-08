"""Pydantic schemas for the decisions API (request/response models)."""

from datetime import datetime
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, model_validator

# A non-blank, whitespace-trimmed label used for titles and option labels.
NonBlankLabel = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=120)
]

# Optional free-form text.
DescriptionText = Annotated[str, StringConstraints(strip_whitespace=True, max_length=500)]


class OptionCreate(BaseModel):
    """A single option supplied when creating a decision."""

    label: NonBlankLabel


class OptionAdd(BaseModel):
    """A single option appended to an existing decision."""

    label: NonBlankLabel


class DecisionCreate(BaseModel):
    """Payload for creating a new decision with its initial options."""

    title: NonBlankLabel
    description: DescriptionText | None = None
    options: list[OptionCreate] = Field(min_length=2, max_length=30)

    @model_validator(mode="after")
    def _reject_duplicate_options(self) -> "DecisionCreate":
        """Options must be unique (case-insensitive)."""
        labels = [option.label.casefold() for option in self.options]
        if len(labels) != len(set(labels)):
            raise ValueError("Options must be unique")
        return self


class DecisionUpdate(BaseModel):
    """Optional fields for updating a decision (PATCH semantics).

    Every field is optional so clients can send only what changed. Omitting
    `description` leaves it untouched; sending `description: null` clears it.
    """

    title: NonBlankLabel | None = None
    description: DescriptionText | None = None


class OptionUpdate(BaseModel):
    """A new label for an existing option."""

    label: NonBlankLabel


class OptionOut(BaseModel):
    """An option as returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    label: str
    created_at: datetime


class DecisionOut(BaseModel):
    """A full decision as returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str | None
    status: Literal["open", "decided"]
    winner: OptionOut | None
    options: list[OptionOut]
    created_at: datetime


class DecisionSummaryOut(BaseModel):
    """A compact decision shown in list views."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str | None
    status: Literal["open", "decided"]
    winner: OptionOut | None
    option_count: int
    created_at: datetime


class PickOut(BaseModel):
    """Result of asking the app to decide."""

    decision_id: int
    winner: OptionOut