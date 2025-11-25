from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from app import dependencies
from app.config import settings
from app.crud import inquiries as inquiries_crud
from app.schemas.inquiry import InquiryCreate, InquiryListResponse, InquiryRead

router = APIRouter(prefix=f"{settings.api_prefix}/inquiries", tags=["inquiries"])


@router.get("/", response_model=InquiryListResponse)
def list_inquiries(session: Session = Depends(dependencies.get_db)) -> InquiryListResponse:
    items = inquiries_crud.list_inquiries(session)
    return InquiryListResponse(items=[InquiryRead.model_validate(i) for i in items])


@router.post("/", response_model=InquiryRead, status_code=status.HTTP_201_CREATED)
def create_inquiry(payload: InquiryCreate, session: Session = Depends(dependencies.get_db)) -> InquiryRead:
    inquiry = inquiries_crud.create_inquiry(session, payload)
    return InquiryRead.model_validate(inquiry)


@router.get("/{inquiry_id}", response_model=InquiryRead)
def get_inquiry(inquiry_id: str, session: Session = Depends(dependencies.get_db)) -> InquiryRead:
    inquiry = inquiries_crud.get_inquiry(session, inquiry_id)
    if not inquiry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="INQUIRY_NOT_FOUND")
    return InquiryRead.model_validate(inquiry)

