from __future__ import annotations

import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..db.base import Base


class Escalation(Base):
    __tablename__ = "escalation"

    escalation_id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    inquiry_id: Mapped[str] = mapped_column(
        ForeignKey("inquiry.inquiry_id", ondelete="CASCADE"), unique=True
    )
    escalation_flag: Mapped[bool] = mapped_column(default=False, nullable=False)
    escalation_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    assigned_to: Mapped[str | None] = mapped_column(String(50), nullable=True)
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    inquiry: Mapped["Inquiry"] = relationship("Inquiry", back_populates="escalation")
