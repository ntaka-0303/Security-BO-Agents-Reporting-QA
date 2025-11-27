from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..config import get_settings
from ..dependencies import get_db
from ..models import AiResponse, Inquiry
from ..schemas import TriageRequest, TriageResult
from ..utils.danger_words import detect_danger_words, load_danger_words
from ..workflows.triage import evaluate

router = APIRouter()


@router.post("/triage", response_model=TriageResult)
def triage(payload: TriageRequest, db: Session = Depends(get_db)):
    ai_record = db.query(AiResponse).filter_by(ai_response_id=payload.ai_response_id).first()
    if ai_record is None:
        raise HTTPException(status_code=404, detail="AI response not found")

    inquiry = db.query(Inquiry).filter_by(inquiry_id=payload.inquiry_id).first()
    if inquiry is None:
        raise HTTPException(status_code=404, detail="Inquiry not found")

    settings = get_settings()
    dictionary = load_danger_words(settings.danger_words_path)
    hits = detect_danger_words(inquiry.question_text, dictionary)
    should_escalate, score, rationale = evaluate(
        ai_record, payload.edit_distance, payload.operator_confidence, len(hits)
    )
    return TriageResult(
        should_escalate=should_escalate,
        rationale=rationale,
        recommended_channel="backoffice" if should_escalate else "operator",
        confidence=score,
    )
