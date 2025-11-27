from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import datetime
from typing import Any

from sqlalchemy.orm import Session

from ..config import get_settings
from ..models import AiResponse, Inquiry
from ..schemas.ai import AiResponseCreate
from ..utils.danger_words import detect_danger_words, load_danger_words
from ..utils.prompting import load_prompt
from ..utils.rag import find_relevant_sections

settings = get_settings()


@dataclass
class GeneratedAnswer:
    answer_text: str
    evidence: list[dict[str, Any]]
    operator_memo: list[str]
    confidence: float

    def to_record(self) -> dict[str, Any]:
        payload = asdict(self)
        payload["created_at"] = datetime.utcnow().isoformat()
        return payload


def _compose_answer(inquiry: Inquiry, sections: list[dict[str, Any]], danger_hits: list[str]) -> GeneratedAnswer:
    base_prompt = load_prompt(settings.base_prompt_path)
    memo: list[str] = []
    if not sections:
        memo.append("帳票の解析結果が不足しています。必要なページをアップロードしてください。")
    if danger_hits:
        memo.append(f"危険語検知: {', '.join(danger_hits)}。必ず内容を精査してください。")

    evidence = [
        {
            "source": section.get("title", "不明セクション"),
            "page": section.get("page"),
            "snippet": section.get("text", "")[:180],
        }
        for section in sections
    ]

    answer_body = "\n".join(
        [
            f"お尋ねの件は {inquiry.inquiry_category} に含まれる項目で、",
            "帳票上の該当箇所を確認したところ、指定の金額は該当期間の累計値です。",
            "詳細な内訳は根拠欄に記載した明細行をご参照ください。",
            "最終的な税務判断が必要な場合は専門家への確認をお願いします。",
        ]
    )

    answer_text = f"{base_prompt}\n\n# 顧客向け回答案\n{answer_body}"

    confidence = min(0.95, 0.55 + 0.1 * len(sections) - 0.1 * len(danger_hits))
    return GeneratedAnswer(
        answer_text=answer_text,
        evidence=evidence,
        operator_memo=memo,
        confidence=max(confidence, 0.35),
    )


def enqueue_ai_generation(db: Session, payload: AiResponseCreate) -> AiResponse:
    inquiry: Inquiry | None = db.query(Inquiry).filter_by(inquiry_id=payload.inquiry_id).first()
    if not inquiry:
        raise ValueError("Inquiry not found")

    danger_dict = load_danger_words(settings.danger_words_path)
    hits = detect_danger_words(inquiry.question_text, danger_dict)

    sections: list[dict[str, Any]] = []
    for report in inquiry.reports:
        sections.extend(find_relevant_sections(inquiry.question_text, report.report_structured_json))

    generated = _compose_answer(inquiry, sections, hits)

    ai_response = AiResponse(
        inquiry_id=inquiry.inquiry_id,
        ai_answer_draft=generated.answer_text,
        evidence_refs=generated.evidence,
        operator_edits={"memo": generated.operator_memo},
        confidence_score=generated.confidence,
        version_no=len(inquiry.ai_responses) + 1,
    )
    db.add(ai_response)
    db.commit()
    db.refresh(ai_response)
    return ai_response


def list_ai_responses(db: Session, limit: int = 20) -> list[AiResponse]:
    return (
        db.query(AiResponse)
        .order_by(AiResponse.created_at.desc())
        .limit(limit)
        .all()
    )


def get_ai_response(db: Session, ai_response_id: str) -> AiResponse | None:
    return db.query(AiResponse).filter_by(ai_response_id=ai_response_id).first()


def apply_operator_review(db: Session, ai_response_id: str, updates: dict[str, Any]) -> AiResponse:
    record: AiResponse | None = db.query(AiResponse).filter_by(ai_response_id=ai_response_id).first()
    if not record:
        raise ValueError("AI response not found")

    if "ai_answer_draft" in updates and updates["ai_answer_draft"]:
        record.ai_answer_draft = updates["ai_answer_draft"]
    if "operator_edits" in updates and updates["operator_edits"] is not None:
        record.operator_edits = updates["operator_edits"]
    if "confidence_score" in updates and updates["confidence_score"] is not None:
        record.confidence_score = float(updates["confidence_score"])

    db.commit()
    db.refresh(record)
    return record
