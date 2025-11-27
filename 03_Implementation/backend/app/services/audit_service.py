from sqlalchemy.orm import Session

from ..models import FinalResponseLog


def list_final_logs(db: Session, limit: int = 50) -> list[FinalResponseLog]:
    return db.query(FinalResponseLog).order_by(FinalResponseLog.sent_at.desc()).limit(limit).all()
