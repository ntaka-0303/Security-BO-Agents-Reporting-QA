from sqlalchemy.orm import Session

from ..models import ReportMeta
from ..schemas.document import DocumentIngestRequest


def ingest_report(db: Session, payload: DocumentIngestRequest) -> ReportMeta:
    report = ReportMeta(
        inquiry_id=payload.inquiry_id,
        report_type=payload.report_type,
        report_file_uri=payload.report_file_uri,
        report_structured_json=payload.report_structured_json,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


def list_reports(db: Session, inquiry_id: str) -> list[ReportMeta]:
    return db.query(ReportMeta).filter_by(inquiry_id=inquiry_id).all()
