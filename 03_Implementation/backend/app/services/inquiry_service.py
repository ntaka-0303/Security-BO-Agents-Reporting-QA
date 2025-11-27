from sqlalchemy.orm import Session

from ..models import Inquiry
from ..schemas import InquiryCreate


def create_inquiry(db: Session, payload: InquiryCreate) -> Inquiry:
    inquiry = Inquiry(
        customer_id=payload.customer_id,
        inquiry_category=payload.inquiry_category,
        question_text=payload.question_text,
        customer_attributes=payload.customer_attributes,
        created_by=payload.created_by,
    )
    db.add(inquiry)
    db.commit()
    db.refresh(inquiry)
    return inquiry


def list_inquiries(db: Session) -> list[Inquiry]:
    return db.query(Inquiry).order_by(Inquiry.created_at.desc()).all()


def get_inquiry(db: Session, inquiry_id: str) -> Inquiry | None:
    return db.query(Inquiry).filter_by(inquiry_id=inquiry_id).first()
