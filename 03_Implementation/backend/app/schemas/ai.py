from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class EvidenceRef(BaseModel):
    source: str
    page: str | None = None
    snippet: str | None = None


class AiResponseCreate(BaseModel):
    inquiry_id: str
    prompt_overrides: dict[str, Any] | None = None


class AiResponseRead(BaseModel):
    ai_response_id: str
    inquiry_id: str
    ai_answer_draft: str
    evidence_refs: list[EvidenceRef]
    operator_edits: dict[str, Any] | None = None
    confidence_score: float
    version_no: int
    created_at: datetime

    class Config:
        from_attributes = True


class AiResponseSummary(BaseModel):
    ai_response_id: str
    version_no: int
    confidence_score: float
    created_at: datetime
    inquiry_id: str

    class Config:
        from_attributes = True


class AiResponseReview(BaseModel):
    operator_edits: dict[str, Any] | None = None
    ai_answer_draft: str | None = None
    confidence_score: float | None = None
