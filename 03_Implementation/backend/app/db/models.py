from __future__ import annotations

from datetime import date, datetime
from typing import List, Optional
from uuid import uuid4

from sqlalchemy import Column, JSON
from sqlmodel import Field, Relationship, SQLModel


def _uuid() -> str:
    return str(uuid4())


class TimestampMixin(SQLModel):
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)


class Inquiry(SQLModel, table=True):
    __tablename__ = "inquiry"

    inquiry_id: str = Field(default_factory=_uuid, primary_key=True, index=True)
    customer_id: str = Field(max_length=20, index=True)
    inquiry_category: str = Field(max_length=50)
    question_text: str
    customer_attributes: dict | None = Field(default=None, sa_column=Column(JSON))
    ai_enabled: bool = Field(default=True)
    created_by: str = Field(max_length=50)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    reports: List["ReportMeta"] = Relationship(back_populates="inquiry")  # type: ignore
    ai_requests: List["AIRequest"] = Relationship(back_populates="inquiry")  # type: ignore
    ai_responses: List["AIResponse"] = Relationship(back_populates="inquiry")  # type: ignore
    escalations: List["Escalation"] = Relationship(back_populates="inquiry")  # type: ignore
    final_response_logs: List["FinalResponseLog"] = Relationship(back_populates="inquiry")  # type: ignore


class ReportMeta(SQLModel, table=True):
    __tablename__ = "report_meta"

    report_meta_id: str = Field(default_factory=_uuid, primary_key=True)
    inquiry_id: str = Field(foreign_key="inquiry.inquiry_id", index=True)
    report_type: str = Field(max_length=50)
    report_file_uri: str = Field(max_length=255)
    report_structured_json: dict = Field(default_factory=dict, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    inquiry: Inquiry = Relationship(back_populates="reports")


class AIRequest(SQLModel, table=True):
    __tablename__ = "ai_request"

    ai_request_id: str = Field(default_factory=_uuid, primary_key=True, index=True)
    inquiry_id: str = Field(foreign_key="inquiry.inquiry_id", index=True)
    report_uris: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    question_text: str
    notes: Optional[str] = None
    tags: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    model_profile: str = Field(max_length=50, default="standard_rag")
    job_id: Optional[str] = Field(default=None, max_length=64)
    status: str = Field(max_length=20, default="queued")
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    inquiry: Inquiry = Relationship(back_populates="ai_requests")
    responses: List["AIResponse"] = Relationship(back_populates="ai_request")  # type: ignore


class AIResponse(SQLModel, table=True):
    __tablename__ = "ai_response"

    ai_response_id: str = Field(default_factory=_uuid, primary_key=True)
    inquiry_id: str = Field(foreign_key="inquiry.inquiry_id", index=True)
    ai_request_id: Optional[str] = Field(default=None, foreign_key="ai_request.ai_request_id")
    version_no: int = Field(default=1)
    ai_answer_draft: str
    evidence_refs: list[dict] = Field(default_factory=list, sa_column=Column(JSON))
    operator_edits: Optional[dict] = Field(default=None, sa_column=Column(JSON))
    confidence_score: float = Field(default=0.0)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    inquiry: Inquiry = Relationship(back_populates="ai_responses")
    ai_request: Optional[AIRequest] = Relationship(back_populates="responses")
    comments: List["ReviewComment"] = Relationship(back_populates="ai_response")  # type: ignore
    sources: List["AIResponseSource"] = Relationship(back_populates="ai_response")  # type: ignore


class ReviewComment(SQLModel, table=True):
    __tablename__ = "review_comment"

    comment_id: str = Field(default_factory=_uuid, primary_key=True)
    ai_response_id: str = Field(foreign_key="ai_response.ai_response_id")
    version_no: int
    comment_text: str
    created_by: str = Field(max_length=50)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    ai_response: AIResponse = Relationship(back_populates="comments")


class AIResponseSource(SQLModel, table=True):
    __tablename__ = "ai_response_source"

    source_id: str = Field(default_factory=_uuid, primary_key=True)
    ai_response_id: str = Field(foreign_key="ai_response.ai_response_id")
    section_id: str = Field(max_length=64)
    page: Optional[int] = None
    quote_text: str
    vector_ref: Optional[str] = Field(default=None, max_length=64)

    ai_response: AIResponse = Relationship(back_populates="sources")


class EscalationSuggestion(SQLModel, table=True):
    __tablename__ = "escalation_suggestion"

    suggestion_id: str = Field(default_factory=_uuid, primary_key=True)
    inquiry_id: str = Field(foreign_key="inquiry.inquiry_id", index=True)
    version_no: int
    decision: str = Field(max_length=16)
    reason_code: Optional[str] = Field(default=None, max_length=64)
    confidence_score: float = Field(default=0.0)
    diff_ratio: float = Field(default=0.0)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)


class Escalation(SQLModel, table=True):
    __tablename__ = "escalation"

    escalation_id: str = Field(default_factory=_uuid, primary_key=True)
    inquiry_id: str = Field(foreign_key="inquiry.inquiry_id", index=True)
    escalation_flag: bool = Field(default=True)
    escalation_reason: Optional[str] = None
    assigned_to: Optional[str] = Field(default=None, max_length=50)
    due_date: Optional[date] = None
    status: str = Field(max_length=20, default="pending")
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    inquiry: Inquiry = Relationship(back_populates="escalations")
    histories: List["BoResponseHistory"] = Relationship(back_populates="escalation")  # type: ignore


class BoResponseHistory(SQLModel, table=True):
    __tablename__ = "bo_response_history"

    history_id: str = Field(default_factory=_uuid, primary_key=True)
    escalation_id: str = Field(foreign_key="escalation.escalation_id")
    response_text: str
    final_checker: Optional[str] = Field(default=None, max_length=50)
    attachments: Optional[list[dict]] = Field(default=None, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    escalation: Escalation = Relationship(back_populates="histories")


class FinalResponseLog(SQLModel, table=True):
    __tablename__ = "final_response_log"

    audit_log_id: str = Field(default_factory=_uuid, primary_key=True)
    inquiry_id: str = Field(foreign_key="inquiry.inquiry_id", index=True)
    final_response_text: str
    channel: str = Field(max_length=20)
    sent_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    sender_id: str = Field(max_length=50)
    bo_response_text: Optional[str] = None
    attachments: Optional[list[dict]] = Field(default=None, sa_column=Column(JSON))

    inquiry: Inquiry = Relationship(back_populates="final_response_logs")


class AuditExportHistory(SQLModel, table=True):
    __tablename__ = "audit_export_history"

    export_id: str = Field(default_factory=_uuid, primary_key=True)
    audit_log_id: str = Field(foreign_key="final_response_log.audit_log_id")
    batch_date: date
    status: str = Field(max_length=16, default="pending")
    retry_count: int = Field(default=0)
    last_error: Optional[str] = None
