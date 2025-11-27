from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..dependencies import get_db
from ..schemas import InquiryCreate, InquiryRead, InquirySummary
from ..services import inquiry_service

router = APIRouter()


@router.post("", response_model=InquiryRead, status_code=status.HTTP_201_CREATED)
def create_inquiry(payload: InquiryCreate, db: Session = Depends(get_db)):
    return inquiry_service.create_inquiry(db, payload)


@router.get("", response_model=list[InquirySummary])
def list_inquiries(db: Session = Depends(get_db)):
    return inquiry_service.list_inquiries(db)


@router.get("/{inquiry_id}", response_model=InquiryRead)
def get_inquiry(inquiry_id: str, db: Session = Depends(get_db)):
    record = inquiry_service.get_inquiry(db, inquiry_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Inquiry not found")
    return record
