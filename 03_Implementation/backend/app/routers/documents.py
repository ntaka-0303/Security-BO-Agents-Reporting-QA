from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from ..dependencies import get_db
from ..schemas import DocumentIngestRequest, ReportMetaRead
from ..services import document_service

router = APIRouter()


@router.post("", response_model=ReportMetaRead, status_code=status.HTTP_201_CREATED)
def ingest_document(payload: DocumentIngestRequest, db: Session = Depends(get_db)):
    return document_service.ingest_report(db, payload)
