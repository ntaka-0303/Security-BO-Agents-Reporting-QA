from __future__ import annotations

from celery import Celery

from ..config import get_settings

settings = get_settings()

celery_app = Celery(
    "reporting_qa",
    broker=str(settings.redis_url),
    backend=str(settings.redis_url),
)

celery_app.conf.task_default_queue = settings.worker.default_queue
celery_app.autodiscover_tasks(["app.workers"])
