from __future__ import annotations

from datetime import date, datetime
from typing import Optional
from uuid import uuid4

from sqlalchemy import Column, JSON
from sqlmodel import Field, SQLModel


def _uuid() -> str:
    return str(uuid4())


# =============================================================================
# CA Summary PoC Models (Primary models used by the application)
# =============================================================================


class CANotice(SQLModel, table=True):
    """CA通知マスタ - Corporate Action通知の原文と基本情報を管理"""
    __tablename__ = "ca_notice"

    ca_notice_id: str = Field(primary_key=True, max_length=64)
    security_code: str = Field(max_length=10, index=True)
    security_name: str = Field(max_length=120)
    ca_event_type: str = Field(max_length=32)
    record_date: date
    payment_date: Optional[date] = None
    notice_text: str
    source_channel: str = Field(default="manual", max_length=32)
    notice_status: str = Field(default="new", max_length=32)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)


class AIRequest(SQLModel, table=True):
    """AIリクエスト - AIドラフト生成のリクエスト情報"""
    __tablename__ = "ai_request"

    ai_request_id: Optional[int] = Field(default=None, primary_key=True)
    ca_notice_id: str = Field(foreign_key="ca_notice.ca_notice_id", index=True, max_length=64)
    template_type: str = Field(default="standard", max_length=32)
    customer_segment: str = Field(default="retail", max_length=32)
    prompt_json: str = Field(default="{}")
    created_by: str = Field(max_length=50)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)


class AIOutput(SQLModel, table=True):
    """AI出力 - AIによる生成結果"""
    __tablename__ = "ai_output"

    ai_output_id: Optional[int] = Field(default=None, primary_key=True)
    ai_request_id: int = Field(foreign_key="ai_request.ai_request_id", index=True)
    internal_summary: str
    customer_draft: str
    model_version: str = Field(max_length=64)
    risk_tokens: Optional[str] = None
    generated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)


class DraftVersion(SQLModel, table=True):
    """ドラフトバージョン - 顧客向け通知のドラフトバージョン管理"""
    __tablename__ = "draft_version"

    draft_id: Optional[int] = Field(default=None, primary_key=True)
    ca_notice_id: str = Field(foreign_key="ca_notice.ca_notice_id", index=True, max_length=64)
    version_no: int = Field(default=1)
    editor_id: str = Field(max_length=50)
    edited_text: str
    ai_output_id: Optional[int] = Field(default=None, foreign_key="ai_output.ai_output_id")
    risk_flag: str = Field(default="N", max_length=1)
    review_comment: Optional[str] = None
    approval_status: str = Field(default="draft", max_length=32)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)


class ApprovalHistory(SQLModel, table=True):
    """承認履歴 - ドラフトの承認/差戻し履歴"""
    __tablename__ = "approval_history"

    approval_id: Optional[int] = Field(default=None, primary_key=True)
    draft_id: int = Field(foreign_key="draft_version.draft_id", index=True)
    approver_id: str = Field(max_length=50)
    decision: str = Field(max_length=16)
    decision_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    approval_comment: Optional[str] = None


class DistributionLog(SQLModel, table=True):
    """配信ログ - 顧客への通知配信記録"""
    __tablename__ = "distribution_log"

    distribution_id: Optional[int] = Field(default=None, primary_key=True)
    draft_id: int = Field(foreign_key="draft_version.draft_id", index=True)
    channel_type: str = Field(max_length=32)
    distribution_status: str = Field(default="pending", max_length=32)
    sent_at: Optional[datetime] = None
    result_detail: Optional[str] = None


class AuditLog(SQLModel, table=True):
    """監査ログ - システム操作の監査証跡"""
    __tablename__ = "audit_log"

    audit_id: str = Field(default_factory=_uuid, primary_key=True)
    entity_type: str = Field(max_length=32)
    entity_id: str = Field(max_length=64)
    action: str = Field(max_length=32)
    performed_by: str = Field(max_length=50)
    performed_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    payload_digest: str = Field(max_length=64)
