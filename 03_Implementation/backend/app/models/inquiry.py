from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..db.base import Base


class Inquiry(Base):
    __tablename__ = "inquiry"

    inquiry_id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    customer_id: Mapped[str] = mapped_column(String(20), nullable=False)
    inquiry_category: Mapped[str] = mapped_column(String(50), nullable=False)
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    customer_attributes: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    ai_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    created_by: Mapped[str] = mapped_column(String(50), nullable=False)

    reports: Mapped[list["ReportMeta"]] = relationship(
        "ReportMeta", back_populates="inquiry", cascade="all, delete-orphan"
    )
    ai_responses: Mapped[list["AiResponse"]] = relationship(
        "AiResponse", back_populates="inquiry", cascade="all, delete-orphan"
    )
    escalation: Mapped["Escalation" | None] = relationship(
        "Escalation", back_populates="inquiry", uselist=False, cascade="all, delete-orphan"
    )
    final_response: Mapped["FinalResponseLog" | None] = relationship(
        "FinalResponseLog", back_populates="inquiry", uselist=False, cascade="all, delete-orphan"
    )


from .ai_response import AiResponse  # noqa: E402  circular import guard
from .escalation import Escalation  # noqa: E402
from .final_response import FinalResponseLog  # noqa: E402
from .report_meta import ReportMeta  # noqa: E402
