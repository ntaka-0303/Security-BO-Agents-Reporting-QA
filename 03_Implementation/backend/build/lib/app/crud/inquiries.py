from __future__ import annotations

from typing import Sequence

from sqlmodel import Session, select

from app.db.models import Inquiry
from app.schemas.inquiry import InquiryCreate


def list_inquiries(session: Session, limit: int = 50) -> Sequence[Inquiry]:
    statement = select(Inquiry).order_by(Inquiry.created_at.desc()).limit(limit)
    return session.exec(statement).all()


def create_inquiry(session: Session, data: InquiryCreate) -> Inquiry:
    inquiry = Inquiry(
        customer_id=data.customer_id,
        inquiry_category=data.inquiry_category,
        question_text=data.question_text,
        ai_enabled=data.ai_enabled,
        customer_attributes=data.customer_attributes or {},
        created_by=data.created_by,
    )
    session.add(inquiry)
    session.flush()
    session.refresh(inquiry)
    return inquiry


def get_inquiry(session: Session, inquiry_id: str) -> Inquiry | None:
    return session.get(Inquiry, inquiry_id)

