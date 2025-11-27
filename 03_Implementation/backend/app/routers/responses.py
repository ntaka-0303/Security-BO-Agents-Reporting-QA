from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..dependencies import get_db
from ..schemas import FinalResponseCreate, FinalResponseRead
from ..services import response_service

router = APIRouter()


@router.post("/finalize", response_model=FinalResponseRead)
def finalize(payload: FinalResponseCreate, db: Session = Depends(get_db)):
    try:
        return response_service.finalize_response(db, payload)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
