from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..dependencies import get_db
from ..schemas import FinalResponseRead
from ..services import audit_service

router = APIRouter()


@router.get("/logs", response_model=list[FinalResponseRead])
def list_logs(db: Session = Depends(get_db)):
    return audit_service.list_final_logs(db)
