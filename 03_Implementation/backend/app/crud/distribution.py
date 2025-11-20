from __future__ import annotations

from typing import List

from sqlmodel import Session, select

from app.db.models import DistributionLog


def create_distribution(session: Session, data: dict) -> DistributionLog:
    record = DistributionLog(**data)
    session.add(record)
    session.commit()
    session.refresh(record)
    return record


def list_distributions(session: Session, draft_id: int) -> List[DistributionLog]:
    statement = select(DistributionLog).where(DistributionLog.draft_id == draft_id).order_by(
        DistributionLog.distribution_id.desc()
    )
    return list(session.exec(statement))
