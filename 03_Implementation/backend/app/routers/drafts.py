from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app import dependencies
from app.config import settings
from app.crud import drafts as drafts_crud
from app.db.models import CANotice
from app.schemas.draft import DraftListResponse, DraftRead, DraftSaveRequest, DraftSubmitRequest
from app.services import audit

router = APIRouter(prefix=f"{settings.api_prefix}/drafts", tags=["drafts"])


@router.get("/pending", response_model=DraftListResponse)
def list_pending_drafts(session: Session = Depends(dependencies.get_db)) -> DraftListResponse:
    drafts = [DraftRead(**draft.model_dump()) for draft in drafts_crud.list_pending_drafts(session)]
    return DraftListResponse(items=drafts)


@router.get("/{notice_id}", response_model=DraftListResponse)
def list_drafts(notice_id: str, session: Session = Depends(dependencies.get_db)) -> DraftListResponse:
    notice = session.get(CANotice, notice_id)
    if not notice:
        raise HTTPException(status_code=404, detail="Notice not found")
    drafts = [DraftRead(**draft.model_dump()) for draft in drafts_crud.list_drafts(session, notice_id)]
    return DraftListResponse(items=drafts)


@router.post("/{notice_id}/save", response_model=DraftRead)
def save_draft(notice_id: str, payload: DraftSaveRequest, session: Session = Depends(dependencies.get_db)) -> DraftRead:
    notice = session.get(CANotice, notice_id)
    if not notice:
        raise HTTPException(status_code=404, detail="Notice not found")

    draft = drafts_crud.create_draft(
        session,
        notice_id=notice_id,
        editor_id=payload.editor_id,
        edited_text=payload.edited_text,
        ai_output_id=payload.ai_output_id,
        risk_flag=payload.risk_flag,
        review_comment=payload.review_comment,
        approval_status="draft",
    )

    notice.notice_status = "draft-updated"
    session.add(notice)
    session.commit()

    audit.record_event(
        session,
        entity_type="DRAFT",
        entity_id=str(draft.draft_id),
        action="SAVE",
        performed_by=payload.editor_id,
        payload=payload.model_dump(),
    )

    return DraftRead(**draft.model_dump())


@router.post("/{draft_id}/submit", response_model=DraftRead)
def submit_draft(draft_id: int, payload: DraftSubmitRequest, session: Session = Depends(dependencies.get_db)) -> DraftRead:
    draft = drafts_crud.get_draft(session, draft_id)
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")

    if payload.risk_flag:
        draft.risk_flag = payload.risk_flag
    if payload.comment:
        draft.review_comment = payload.comment

    draft.approval_status = "pending"
    session.add(draft)
    session.commit()
    session.refresh(draft)

    audit.record_event(
        session,
        entity_type="DRAFT",
        entity_id=str(draft.draft_id),
        action="SUBMIT",
        performed_by=payload.submitted_by,
        payload=payload.model_dump(),
    )

    return DraftRead(**draft.model_dump())
