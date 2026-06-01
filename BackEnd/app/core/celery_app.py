import sys

from celery import Celery

from app.core.config import settings

celery_app = Celery(
    "scriptdna",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=[
        "app.tasks.video_tasks",
        "app.tasks.style_tasks",
        "app.tasks.youtube_tasks",
        "app.tasks.analysis_tasks",
    ],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    # No Windows, prefork não funciona (sem fork()); usa solo como padrão
    worker_pool="solo" if sys.platform == "win32" else "prefork",
    broker_connection_retry_on_startup=True,
)
