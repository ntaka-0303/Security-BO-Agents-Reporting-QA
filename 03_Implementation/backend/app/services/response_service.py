from sqlalchemy.orm import Session

from ..models import FinalResponseLog, Inquiry
from ..schemas import FinalResponseCreate


def finalize_response(db: Session, payload: FinalResponseCreate) -> FinalResponseLog:
    inquiry = db.query(Inquiry).filter_by(inquiry_id=payload.inquiry_id).first()
    if not inquiry:
        raise ValueError("Inquiry not found")

    record = FinalResponseLog(
        inquiry_id=payload.inquiry_id,
        final_response_text=payload.final_response_text,
        channel=payload.channel,
        sender_id=payload.sender_id,
        bo_response_text=payload.bo_response_text,
        attachments=payload.attachments or [],
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record
