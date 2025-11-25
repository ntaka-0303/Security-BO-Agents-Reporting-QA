from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class AIRequestCreate(BaseModel):
    ca_notice_id: str
    template_type: str = Field(default="standard")
    customer_segment: str = Field(default="retail")
    instructions: Optional[str] = None
    created_by: str


class AIResponseEnvelope(BaseModel):
    ai_request_id: int
    ai_output_id: int
    internal_summary: str
    customer_draft: str
    model_version: str
    risk_tokens: Optional[str]
    generated_at: datetime
    draft_version: int
    risk_flag: str


class AIRequestPayload(BaseModel):
    notice_text: str
    security_name: str
    security_code: str
    ca_event_type: str
    template_type: str
    customer_segment: str
    instructions: Optional[str] = None
    record_date: str
    payment_date: Optional[str] = None
