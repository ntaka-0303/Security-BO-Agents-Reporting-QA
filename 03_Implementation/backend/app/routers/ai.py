from __future__ import annotations

import json

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app import dependencies
from app.config import settings
from app.crud import drafts as drafts_crud
from app.db.models import AIOutput, AIRequest, CANotice
from app.schemas.ai import AIRequestCreate, AIRequestPayload, AIResponseEnvelope
from app.services import audit
from app.services.ai_client import generate_draft
from app.services import risk

router = APIRouter(prefix=f"{settings.api_prefix}/ai", tags=["ai"])


@router.post("/requests", response_model=AIResponseEnvelope)
async def create_ai_request(payload: AIRequestCreate, session: Session = Depends(dependencies.get_db)) -> AIResponseEnvelope:
    notice = session.get(CANotice, payload.ca_notice_id)
    if not notice:
        raise HTTPException(status_code=404, detail="Notice not found")

    request_payload = AIRequestPayload(
        notice_text=notice.notice_text,
        security_name=notice.security_name,
        security_code=notice.security_code,
        ca_event_type=notice.ca_event_type,
        template_type=payload.template_type,
        customer_segment=payload.customer_segment,
        instructions=payload.instructions,
        record_date=notice.record_date.isoformat(),
        payment_date=notice.payment_date.isoformat() if notice.payment_date else None,
    )

    ai_request = AIRequest(
        ca_notice_id=payload.ca_notice_id,
        template_type=payload.template_type,
        customer_segment=payload.customer_segment,
        prompt_json=json.dumps(request_payload.model_dump(), ensure_ascii=False),
        created_by=payload.created_by,
    )
    session.add(ai_request)
    session.commit()
    session.refresh(ai_request)

    ai_result = await generate_draft(request_payload)

    ai_output = AIOutput(
        ai_request_id=ai_request.ai_request_id,
        internal_summary=ai_result.internal_summary,
        customer_draft=ai_result.customer_draft,
        model_version=ai_result.model_version,
        risk_tokens=ai_result.risk_tokens,
    )
    session.add(ai_output)
    session.commit()
    session.refresh(ai_output)

    risk_result = risk.calculate_risk_score(
        ca_event_type=notice.ca_event_type,
        risk_tokens=ai_result.risk_tokens,
        manual_flag=None,
    )

    draft = drafts_crud.create_draft(
        session,
        notice_id=notice.ca_notice_id,
        editor_id=payload.created_by,
        edited_text=ai_result.customer_draft,
        ai_output_id=ai_output.ai_output_id,
        risk_flag=risk_result.flag,
        review_comment=None,
        approval_status="draft",
    )

    notice.notice_status = "ai-generated"
    session.add(notice)
    session.commit()

    audit.record_event(
        session,
        entity_type="AI",
        entity_id=str(ai_output.ai_output_id),
        action="GENERATE",
        performed_by=payload.created_by,
        payload=ai_result.model_dump(),
    )

    return AIResponseEnvelope(
        ai_request_id=ai_request.ai_request_id,
        ai_output_id=ai_output.ai_output_id,
        internal_summary=ai_output.internal_summary,
        customer_draft=ai_output.customer_draft,
        model_version=ai_output.model_version,
        risk_tokens=ai_output.risk_tokens,
        generated_at=ai_output.generated_at,
        draft_version=draft.version_no,
        risk_flag=draft.risk_flag,
    )
