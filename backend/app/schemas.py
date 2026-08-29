"""Pydantic schemas for the decisions API (request/response models)."""

from datetime import datetime
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints

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