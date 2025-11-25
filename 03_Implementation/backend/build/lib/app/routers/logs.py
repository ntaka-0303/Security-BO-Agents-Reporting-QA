from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app import dependencies
from app.config import settings
from app.db.models import AuditLog
from app.schemas.log import AuditLogRecord, AuditLogResponse

router = APIRouter(prefix=f"{settings.api_prefix}/logs", tags=["logs"])


@router.get("/", response_model=AuditLogResponse)
def list_logs(session: Session = Depends(dependencies.get_db)) -> AuditLogResponse:
    statement = select(AuditLog).order_by(AuditLog.performed_at.desc()).limit(100)
    items = [AuditLogRecord(**log.model_dump()) for log in session.exec(statement)]
    return AuditLogResponse(items=items)
