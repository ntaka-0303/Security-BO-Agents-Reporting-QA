from __future__ import annotations

from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class NoticeBase(BaseModel):
    security_code: str = Field(max_length=10)
    security_name: str = Field(max_length=120)
    ca_event_type: str = Field(max_length=32)
    record_date: date
    payment_date: Optional[date] = None
    notice_text: str
    source_channel: str = "manual"


class NoticeCreate(NoticeBase):
    ca_notice_id: str = Field(max_length=64)


class NoticeRead(NoticeBase):
    ca_notice_id: str
    notice_status: str
    created_at: datetime
    updated_at: datetime


class NoticeListResponse(BaseModel):
    items: List[NoticeRead]
