from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class InquiryCreate(BaseModel):
    customer_id: str = Field(..., max_length=20)
    inquiry_category: str = Field(..., max_length=50)
    question_text: str
    customer_attributes: dict[str, Any] | None = None
    created_by: str = Field(..., max_length=50)


class InquiryRead(BaseModel):
    inquiry_id: str
    customer_id: str
    inquiry_category: str
    question_text: str
    customer_attributes: dict[str, Any] | None = None
    ai_enabled: bool
    created_at: datetime
    created_by: str

    class Config:
        from_attributes = True


class InquirySummary(BaseModel):
    inquiry_id: str
    customer_id: str
    inquiry_category: str
    created_at: datetime

    class Config:
        from_attributes = True
