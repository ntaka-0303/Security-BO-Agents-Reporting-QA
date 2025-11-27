from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, JSON, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..db.base import Base


class AiResponse(Base):
    __tablename__ = "ai_response"

    ai_response_id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    inquiry_id: Mapped[str] = mapped_column(ForeignKey("inquiry.inquiry_id", ondelete="CASCADE"))
    ai_answer_draft: Mapped[str] = mapped_column(Text, nullable=False)
    evidence_refs: Mapped[dict] = mapped_column(JSON, nullable=False)
    operator_edits: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    confidence_score: Mapped[float] = mapped_column(Numeric(3, 2), default=0.0, nullable=False)
    version_no: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    inquiry: Mapped["Inquiry"] = relationship("Inquiry", back_populates="ai_responses")
