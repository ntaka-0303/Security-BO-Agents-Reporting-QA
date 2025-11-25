from __future__ import annotations

from datetime import datetime, timedelta
from typing import Literal
from uuid import uuid4

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.config import settings

router = APIRouter(prefix=f"{settings.api_prefix}/stubs", tags=["stubs"])


class SecurityInfo(BaseModel):
    ca_notice_id: str
    security_code: str
    security_name: str
    ca_event_type: str
    record_date: str
    payment_date: str | None
    source: Literal["S-001"]


class DistributionRequest(BaseModel):
    draft_id: int
    channel_type: str
    payload_digest: str | None = None


class DistributionResponse(BaseModel):
    send_batch_id: str
    distribution_status: Literal["queued", "success"]
    accepted_at: datetime


class WorkflowRequest(BaseModel):
    workflow_case_id: str
    decision: Literal["approved", "rejected"]
    approver_id: str
    comment: str | None = None


class WorkflowResponse(BaseModel):
    workflow_case_id: str
    status: Literal["closed", "rework"]
    decided_at: datetime
    reference_number: str


SAMPLE_NOTICES = {
    "CA-20241001-001": SecurityInfo(
        ca_notice_id="CA-20241001-001",
        security_code="8001",
        security_name="サンプル商事",
        ca_event_type="配当",
        record_date="2024-10-05",
        payment_date="2024-11-01",
        source="S-001",
    ),
    "CA-20241015-002": SecurityInfo(
        ca_notice_id="CA-20241015-002",
        security_code="7203",
        security_name="サンプル自動車",
        ca_event_type="株式分割",
        record_date="2024-10-20",
        payment_date=None,
        source="S-001",
    ),
}

SAMPLE_SECURITIES = {
    "8001": {"security_name": "サンプル商事", "market": "東証プライム"},
    "7203": {"security_name": "サンプル自動車", "market": "東証プライム"},
    "6758": {"security_name": "サンプルエレクトロニクス", "market": "東証プライム"},
}


@router.get("/s001/notices/{ca_notice_id}", response_model=SecurityInfo)
def get_notice_stub(ca_notice_id: str) -> SecurityInfo:
    if ca_notice_id not in SAMPLE_NOTICES:
        raise HTTPException(status_code=404, detail="Notice not found in stub")
    return SAMPLE_NOTICES[ca_notice_id]


@router.get("/s001/securities/{security_code}")
def get_security_stub(security_code: str) -> dict[str, str]:
    data = SAMPLE_SECURITIES.get(security_code)
    if not data:
        raise HTTPException(status_code=404, detail="Security not found in stub")
    return {"security_code": security_code, **data}


@router.post("/s003/distributions", response_model=DistributionResponse)
def create_distribution_stub(payload: DistributionRequest) -> DistributionResponse:
    # Always accept and simulate async queue
    return DistributionResponse(
        send_batch_id=f"STUB-{uuid4().hex[:8]}",
        distribution_status="queued",
        accepted_at=datetime.utcnow(),
    )


@router.post("/s004/workflow", response_model=WorkflowResponse)
def workflow_stub(payload: WorkflowRequest) -> WorkflowResponse:
    status = "closed" if payload.decision == "approved" else "rework"
    return WorkflowResponse(
        workflow_case_id=payload.workflow_case_id,
        status=status,
        decided_at=datetime.utcnow() + timedelta(seconds=1),
        reference_number=f"WF-{uuid4().hex[:6]}",
    )

