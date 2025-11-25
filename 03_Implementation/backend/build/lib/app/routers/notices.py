from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app import dependencies
from app.config import settings
from app.crud import notices as notices_crud
from app.schemas.notice import NoticeCreate, NoticeListResponse, NoticeRead
from app.services import audit

router = APIRouter(prefix=f"{settings.api_prefix}/notices", tags=["notices"])


@router.post("/", response_model=NoticeRead, status_code=201)
def create_notice(payload: NoticeCreate, session: Session = Depends(dependencies.get_db)) -> NoticeRead:
    existing = notices_crud.get_notice(session, payload.ca_notice_id)
    if existing:
        raise HTTPException(status_code=409, detail="Notice already exists")

    notice = notices_crud.create_notice(session, payload.model_dump())
    audit.record_event(
        session,
        entity_type="NOTICE",
        entity_id=notice.ca_notice_id,
        action="CREATE",
        performed_by="system",
        payload=payload.model_dump(),
    )
    return NoticeRead(**notice.model_dump())


@router.get("/", response_model=NoticeListResponse)
def list_notices(session: Session = Depends(dependencies.get_db)) -> NoticeListResponse:
    items = [NoticeRead(**item.model_dump()) for item in notices_crud.list_notices(session)]
    return NoticeListResponse(items=items)


@router.get("/{notice_id}", response_model=NoticeRead)
def read_notice(notice_id: str, session: Session = Depends(dependencies.get_db)) -> NoticeRead:
    notice = notices_crud.get_notice(session, notice_id)
    if not notice:
        raise HTTPException(status_code=404, detail="Notice not found")
    return NoticeRead(**notice.model_dump())
