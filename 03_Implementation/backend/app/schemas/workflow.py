from pydantic import BaseModel, Field


class TriageRequest(BaseModel):
    inquiry_id: str
    ai_response_id: str
    edit_distance: float = Field(..., ge=0.0)
    operator_confidence: float = Field(..., ge=0.0, le=1.0)


class TriageResult(BaseModel):
    should_escalate: bool
    rationale: str
    recommended_channel: str
    confidence: float
