from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class ApprovalRequest(BaseModel):
    approver_id: str
    decision: str = Field(pattern="^(approved|rejected)$")
    comment: Optional[str] = None


class ApprovalRecord(BaseModel):
    approval_id: int
    draft_id: int
    approver_id: str
    decision: str
    decision_at: datetime
    approval_comment: Optional[str]


class ApprovalListResponse(BaseModel):
    items: List[ApprovalRecord]
