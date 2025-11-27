from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..db.base import Base


class ReportMeta(Base):
    __tablename__ = "report_meta"

    report_meta_id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    inquiry_id: Mapped[str] = mapped_column(ForeignKey("inquiry.inquiry_id", ondelete="CASCADE"))
    report_type: Mapped[str] = mapped_column(String(50), nullable=False)
    report_file_uri: Mapped[str] = mapped_column(String(255), nullable=False)
    report_structured_json: Mapped[dict] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    inquiry: Mapped["Inquiry"] = relationship("Inquiry", back_populates="reports")
