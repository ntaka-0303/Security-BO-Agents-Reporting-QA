from __future__ import annotations

from fastapi import FastAPI

from app.config import settings
from app.db.session import init_db
from app.routers import inquiries

app = FastAPI(title=settings.app_name, openapi_url=f"{settings.api_prefix}/openapi.json")


@app.on_event("startup")
async def startup_event() -> None:
    init_db()


@app.get("/health", tags=["system"])
async def health_check() -> dict[str, str]:
    return {"status": "ok", "app": settings.app_name}


app.include_router(inquiries.router)
