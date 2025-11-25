from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db.session import init_db
from app.routers import ai, approvals, distribution, drafts, inquiries, logs, notices, stubs

app = FastAPI(title=settings.app_name, openapi_url=f"{settings.api_prefix}/openapi.json")

# CORS設定（開発環境用）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event() -> None:
    init_db()


@app.get("/health", tags=["system"])
async def health_check() -> dict[str, str]:
    return {"status": "ok", "app": settings.app_name}


# ルーター登録
app.include_router(inquiries.router)
app.include_router(notices.router)
app.include_router(ai.router)
app.include_router(drafts.router)
app.include_router(approvals.router)
app.include_router(distribution.router)
app.include_router(logs.router)
app.include_router(stubs.router)
