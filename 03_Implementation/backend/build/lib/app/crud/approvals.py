from __future__ import annotations

from typing import List

from sqlmodel import Session, select

from app.db.models import ApprovalHistory


def create_approval(session: Session, data: dict) -> ApprovalHistory:
    approval = ApprovalHistory(**data)
    session.add(approval)
    session.commit()
    session.refresh(approval)
    return approval


def list_approvals(session: Session, draft_id: int) -> List[ApprovalHistory]:
    statement = select(ApprovalHistory).where(ApprovalHistory.draft_id == draft_id).order_by(
        ApprovalHistory.decision_at.desc()
    )
    return list(session.exec(statement))
