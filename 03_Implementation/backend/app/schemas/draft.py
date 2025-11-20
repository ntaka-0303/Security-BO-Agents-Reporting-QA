from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class DraftSaveRequest(BaseModel):
    editor_id: str
    edited_text: str
    ai_output_id: Optional[int] = None
    risk_flag: str = Field(default="N", pattern="^[NY]$")
    review_comment: Optional[str] = None


class DraftSubmitRequest(BaseModel):
    submitted_by: str
    risk_flag: Optional[str] = None
    comment: Optional[str] = None


class DraftRead(BaseModel):
    draft_id: int
    ca_notice_id: str
    version_no: int
    editor_id: str
    edited_text: str
    risk_flag: str
    approval_status: str
    review_comment: Optional[str]
    updated_at: datetime
    ai_output_id: Optional[int]


class DraftListResponse(BaseModel):
    items: List[DraftRead]
