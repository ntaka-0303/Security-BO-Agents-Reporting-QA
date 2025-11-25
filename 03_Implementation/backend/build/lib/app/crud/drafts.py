from __future__ import annotations

from typing import List, Optional

from sqlmodel import Session, select

from app.db.models import DraftVersion


def latest_version(session: Session, notice_id: str) -> int:
    statement = select(DraftVersion.version_no).where(DraftVersion.ca_notice_id == notice_id).order_by(
        DraftVersion.version_no.desc()
    )
    result = session.exec(statement).first()
    return result or 0


def create_draft(
    session: Session,
    *,
    notice_id: str,
    editor_id: str,
    edited_text: str,
    ai_output_id: Optional[int],
    risk_flag: str,
    review_comment: Optional[str] = None,
    approval_status: str = "draft",
) -> DraftVersion:
    version_no = latest_version(session, notice_id) + 1
    draft = DraftVersion(
        ca_notice_id=notice_id,
        version_no=version_no,
        editor_id=editor_id,
        edited_text=edited_text,
        ai_output_id=ai_output_id,
        risk_flag=risk_flag,
        review_comment=review_comment,
        approval_status=approval_status,
    )
    session.add(draft)
    session.commit()
    session.refresh(draft)
    return draft


def get_draft(session: Session, draft_id: int) -> Optional[DraftVersion]:
    return session.get(DraftVersion, draft_id)


def list_drafts(session: Session, notice_id: str) -> List[DraftVersion]:
    statement = (
        select(DraftVersion)
        .where(DraftVersion.ca_notice_id == notice_id)
        .order_by(DraftVersion.version_no.desc())
    )
    return list(session.exec(statement))


def list_pending_drafts(session: Session) -> List[DraftVersion]:
    statement = (
        select(DraftVersion)
        .where(DraftVersion.approval_status == "pending")
        .order_by(DraftVersion.updated_at.desc())
    )
    return list(session.exec(statement))
