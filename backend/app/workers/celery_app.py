from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "engunity",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)

# Optimize Celery settings
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    worker_prefetch_multiplier=4,
    worker_max_tasks_per_child=1000,
)

# Auto-discover tasks from all registered apps
celery_app.autodiscover_tasks(['app.services.ai', 'app.services.rag'])
