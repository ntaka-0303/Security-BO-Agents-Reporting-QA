from __future__ import annotations

from typing import Any

from .celery_app import celery_app
from ..db.session import SessionLocal
from ..services.ai_service import enqueue_ai_generation
from ..services.response_service import finalize_response
from ..schemas import AiResponseCreate, FinalResponseCreate


@celery_app.task(name="ai.generate_response")
def generate_response(payload: dict[str, Any]) -> str:
    session = SessionLocal()
    try:
        response = enqueue_ai_generation(session, AiResponseCreate(**payload))
        return response.ai_response_id
    finally:
        session.close()


@celery_app.task(name="response.finalize")
def finalize_response_task(payload: dict[str, Any]) -> str:
    session = SessionLocal()
    try:
        record = finalize_response(session, FinalResponseCreate(**payload))
        return record.audit_log_id
    finally:
        session.close()
