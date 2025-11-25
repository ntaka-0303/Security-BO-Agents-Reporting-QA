from __future__ import annotations

from datetime import datetime
from typing import List

from pydantic import BaseModel


class AuditLogRecord(BaseModel):
    audit_id: str
    entity_type: str
    entity_id: str
    action: str
    performed_by: str
    performed_at: datetime
    payload_digest: str


class AuditLogResponse(BaseModel):
    items: List[AuditLogRecord]
