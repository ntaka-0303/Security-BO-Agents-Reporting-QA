from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..dependencies import get_db
from ..schemas import AiResponseCreate, AiResponseRead, AiResponseReview, AiResponseSummary
from ..services import ai_service

router = APIRouter()


@router.get("/responses", response_model=list[AiResponseSummary])
def list_responses(db: Session = Depends(get_db)):
    return ai_service.list_ai_responses(db)


@router.get("/responses/{ai_response_id}", response_model=AiResponseRead)
def fetch_response(ai_response_id: str, db: Session = Depends(get_db)):
    record = ai_service.get_ai_response(db, ai_response_id)
    if record is None:
        raise HTTPException(status_code=404, detail="AI response not found")
    return record


@router.post("/responses", response_model=AiResponseRead)
def generate_response(payload: AiResponseCreate, db: Session = Depends(get_db)):
    try:
        return ai_service.enqueue_ai_generation(db, payload)
    except ValueError as exc:  # pragma: no cover - input validation branch
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.patch("/responses/{ai_response_id}", response_model=AiResponseRead)
def review_response(
    ai_response_id: str, payload: AiResponseReview, db: Session = Depends(get_db)
):
    try:
        return ai_service.apply_operator_review(db, ai_response_id, payload.model_dump(exclude_unset=True))
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
