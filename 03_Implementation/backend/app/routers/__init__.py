from fastapi import APIRouter

from . import ai, audits, documents, escalations, inquiries, responses, workflows

api_router = APIRouter()
api_router.include_router(inquiries.router, prefix="/inquiries", tags=["inquiries"])
api_router.include_router(documents.router, prefix="/documents", tags=["documents"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
api_router.include_router(responses.router, prefix="/responses", tags=["responses"])
api_router.include_router(workflows.router, prefix="/workflows", tags=["workflows"])
api_router.include_router(escalations.router, prefix="/escalations", tags=["escalations"])
api_router.include_router(audits.router, prefix="/audits", tags=["audits"])
