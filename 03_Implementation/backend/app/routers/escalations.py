from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..dependencies import get_db
from ..models import Escalation
from ..schemas import EscalationCreate, EscalationRead, EscalationUpdate
from ..services import escalation_service

router = APIRouter()


@router.post("/{inquiry_id}", response_model=EscalationRead)
def create_escalation(inquiry_id: str, payload: EscalationCreate, db: Session = Depends(get_db)):
    return escalation_service.upsert_escalation(db, inquiry_id, payload)


@router.patch("/{escalation_id}", response_model=EscalationRead)
def update_escalation(escalation_id: str, payload: EscalationUpdate, db: Session = Depends(get_db)):
    try:
        return escalation_service.update_escalation(db, escalation_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/{inquiry_id}", response_model=EscalationRead)
def get_escalation(inquiry_id: str, db: Session = Depends(get_db)):
    record = db.query(Escalation).filter_by(inquiry_id=inquiry_id).first()
    if record is None:
        raise HTTPException(status_code=404, detail="Escalation not found")
    return record
