from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app import dependencies
from app.config import settings
from app.crud import approvals as approvals_crud
from app.crud import drafts as drafts_crud
from app.schemas.approval import ApprovalListResponse, ApprovalRecord, ApprovalRequest
from app.schemas.draft import DraftRead
from app.services import audit

router = APIRouter(prefix=f"{settings.api_prefix}/approvals", tags=["approvals"])


@router.post("/{draft_id}", response_model=DraftRead)
def decide_approval(draft_id: int, payload: ApprovalRequest, session: Session = Depends(dependencies.get_db)) -> DraftRead:
    draft = drafts_crud.get_draft(session, draft_id)
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")

    approval = approvals_crud.create_approval(
        session,
        {
            "draft_id": draft_id,
            "approver_id": payload.approver_id,
            "decision": payload.decision,
            "approval_comment": payload.comment,
        },
    )

    draft.approval_status = payload.decision
    session.add(draft)
    session.commit()
    session.refresh(draft)

    audit.record_event(
        session,
        entity_type="APPROVAL",
        entity_id=str(approval.approval_id),
        action="DECIDE",
        performed_by=payload.approver_id,
        payload=payload.model_dump(),
    )

    return DraftRead(**draft.model_dump())


@router.get("/{draft_id}", response_model=ApprovalListResponse)
def list_approvals(draft_id: int, session: Session = Depends(dependencies.get_db)) -> ApprovalListResponse:
    _ = drafts_crud.get_draft(session, draft_id)
    approvals = approvals_crud.list_approvals(session, draft_id)
    records = [ApprovalRecord(**item.model_dump()) for item in approvals]
    return ApprovalListResponse(items=records)
