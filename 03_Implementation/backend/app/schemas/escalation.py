from datetime import date, datetime

from pydantic import BaseModel, Field


class EscalationCreate(BaseModel):
    inquiry_id: str
    escalation_flag: bool = True
    escalation_reason: str | None = None
    assigned_to: str | None = Field(default=None, max_length=50)
    due_date: date | None = None


class EscalationUpdate(BaseModel):
    escalation_flag: bool | None = None
    escalation_reason: str | None = None
    assigned_to: str | None = Field(default=None, max_length=50)
    due_date: date | None = None
    status: str | None = Field(default=None, pattern=r"^(pending|in_progress|done)$")


class EscalationRead(BaseModel):
    escalation_id: str
    inquiry_id: str
    escalation_flag: bool
    escalation_reason: str | None = None
    assigned_to: str | None = None
    due_date: date | None = None
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
