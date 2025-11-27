from datetime import datetime

from pydantic import BaseModel, Field


class DocumentIngestRequest(BaseModel):
    inquiry_id: str = Field(..., description="対象問い合わせ ID")
    report_type: str = Field(..., max_length=50)
    report_file_uri: str = Field(..., description="帳票ファイルのストレージ URI")
    report_structured_json: dict = Field(..., description="解析済みセクション情報")


class ReportMetaRead(BaseModel):
    report_meta_id: str
    inquiry_id: str
    report_type: str
    report_file_uri: str
    report_structured_json: dict
    created_at: datetime

    class Config:
        from_attributes = True
