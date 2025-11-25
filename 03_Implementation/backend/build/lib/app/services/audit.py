from __future__ import annotations

import hashlib
import json
import uuid
from datetime import datetime
from typing import Any

from sqlmodel import Session

from app.db.models import AuditLog


def _digest(payload: Any) -> str:
    try:
        serialized = json.dumps(payload, ensure_ascii=False, sort_keys=True)
    except TypeError:
        serialized = str(payload)
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()


def record_event(
    session: Session,
    *,
    entity_type: str,
    entity_id: str,
    action: str,
    performed_by: str,
    payload: Any,
) -> AuditLog:
    log = AuditLog(
        audit_id=str(uuid.uuid4()),
        entity_type=entity_type,
        entity_id=entity_id,
        action=action,
        performed_by=performed_by,
        performed_at=datetime.utcnow(),
        payload_digest=_digest(payload),
    )
    session.add(log)
    session.commit()
    session.refresh(log)
    return log
