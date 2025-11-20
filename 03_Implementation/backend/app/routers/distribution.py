from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app import dependencies
from app.config import settings
from app.crud import distribution as distribution_crud
from app.crud import drafts as drafts_crud
from app.schemas.distribution import DistributionListResponse, DistributionRecord, DistributionRequest
from app.services import audit

router = APIRouter(prefix=f"{settings.api_prefix}/distribution", tags=["distribution"])


@router.post("/{draft_id}", response_model=DistributionRecord)
def send_distribution(draft_id: int, payload: DistributionRequest, session: Session = Depends(dependencies.get_db)) -> DistributionRecord:
    draft = drafts_crud.get_draft(session, draft_id)
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    if draft.approval_status != "approved":
        raise HTTPException(status_code=400, detail="Draft must be approved before distribution")

    record = distribution_crud.create_distribution(
        session,
        {
            "draft_id": draft_id,
            "channel_type": payload.channel_type,
            "distribution_status": "success",
            "sent_at": datetime.utcnow(),
            "result_detail": "mock-sent",
        },
    )

    audit.record_event(
        session,
        entity_type="DISTRIBUTION",
        entity_id=str(record.distribution_id),
        action="SEND",
        performed_by=payload.requested_by,
        payload=payload.model_dump(),
    )

    return DistributionRecord(**record.model_dump())


@router.get("/{draft_id}", response_model=DistributionListResponse)
def list_distribution(draft_id: int, session: Session = Depends(dependencies.get_db)) -> DistributionListResponse:
    records = distribution_crud.list_distributions(session, draft_id)
    return DistributionListResponse(items=[DistributionRecord(**item.model_dump()) for item in records])
