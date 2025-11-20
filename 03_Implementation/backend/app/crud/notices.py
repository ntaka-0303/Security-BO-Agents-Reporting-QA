from __future__ import annotations

from typing import List, Optional

from sqlmodel import Session, select

from app.db.models import CANotice


def create_notice(session: Session, data: dict) -> CANotice:
    notice = CANotice(**data)
    session.add(notice)
    session.commit()
    session.refresh(notice)
    return notice


def get_notice(session: Session, notice_id: str) -> Optional[CANotice]:
    return session.get(CANotice, notice_id)


def list_notices(session: Session) -> List[CANotice]:
    statement = select(CANotice).order_by(CANotice.created_at.desc())
    return list(session.exec(statement))
