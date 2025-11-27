from datetime import datetime

from pydantic import BaseModel, Field


class FinalResponseCreate(BaseModel):
    inquiry_id: str
    final_response_text: str
    channel: str = Field(..., max_length=20)
    sender_id: str = Field(..., max_length=50)
    bo_response_text: str | None = None
    attachments: list[dict] | None = None


class FinalResponseRead(BaseModel):
    audit_log_id: str
    inquiry_id: str
    final_response_text: str
    channel: str
    sent_at: datetime
    sender_id: str
    bo_response_text: str | None = None
    attachments: list[dict] | None = None

    class Config:
        from_attributes = True
