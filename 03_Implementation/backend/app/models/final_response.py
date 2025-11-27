from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..db.base import Base


class FinalResponseLog(Base):
    __tablename__ = "final_response_log"

    audit_log_id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    inquiry_id: Mapped[str] = mapped_column(
        ForeignKey("inquiry.inquiry_id", ondelete="CASCADE"), unique=True
    )
    final_response_text: Mapped[str] = mapped_column(Text, nullable=False)
    channel: Mapped[str] = mapped_column(String(20), nullable=False)
    sent_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    sender_id: Mapped[str] = mapped_column(String(50), nullable=False)
    bo_response_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    attachments: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    inquiry: Mapped["Inquiry"] = relationship("Inquiry", back_populates="final_response")
