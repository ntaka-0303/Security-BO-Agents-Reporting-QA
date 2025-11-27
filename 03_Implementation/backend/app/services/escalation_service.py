from sqlalchemy.orm import Session

from ..models import Escalation
from ..schemas import EscalationCreate, EscalationUpdate


def upsert_escalation(db: Session, inquiry_id: str, payload: EscalationCreate) -> Escalation:
    escalation = db.query(Escalation).filter_by(inquiry_id=inquiry_id).first()
    if escalation is None:
        escalation = Escalation(inquiry_id=inquiry_id)
        db.add(escalation)

    escalation.escalation_flag = payload.escalation_flag
    escalation.escalation_reason = payload.escalation_reason
    escalation.assigned_to = payload.assigned_to
    escalation.due_date = payload.due_date
    escalation.status = "pending"

    db.commit()
    db.refresh(escalation)
    return escalation


def update_escalation(db: Session, escalation_id: str, payload: EscalationUpdate) -> Escalation:
    escalation = db.query(Escalation).filter_by(escalation_id=escalation_id).first()
    if escalation is None:
        raise ValueError("Escalation not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(escalation, field, value)

    db.commit()
    db.refresh(escalation)
    return escalation
