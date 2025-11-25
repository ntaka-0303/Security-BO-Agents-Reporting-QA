from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field, field_validator


class InquiryBase(BaseModel):
    customer_id: str = Field(max_length=20)
    inquiry_category: str = Field(max_length=50)
    question_text: str
    ai_enabled: bool = True
    customer_attributes: dict[str, Any] | None = None
    created_by: str = Field(max_length=50)


class InquiryCreate(InquiryBase):
    pass


class InquiryRead(InquiryBase):
    inquiry_id: str
    created_at: datetime


class InquiryListResponse(BaseModel):
    items: list[InquiryRead]


class InquirySummary(BaseModel):
    inquiry_id: str
    customer_id: str
    inquiry_category: str
    created_at: datetime


class InquirySummaryResponse(BaseModel):
    items: list[InquirySummary]

    @field_validator("items")
    @classmethod
    def sort_items(cls, value: list[InquirySummary]) -> list[InquirySummary]:
        return sorted(value, key=lambda item: item.created_at, reverse=True)

