import uuid
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

import pytest

from app.services.learning_loop_service import LearningLoopService


@pytest.mark.asyncio
async def test_learning_loop_skips_without_metrics(monkeypatch):
    service = LearningLoopService()
    short = SimpleNamespace(id=uuid.uuid4(), user_id=uuid.uuid4(), published_at=None)
    analysis = SimpleNamespace(id=uuid.uuid4())

    async def no_metrics(short_id, db):
        return None

    monkeypatch.setattr(service, "_latest_metrics", no_metrics)

    can_learn, reason = await service.can_learn_from_short(short, analysis, db=None)

    assert can_learn is False
    assert reason == "missing_metrics"


@pytest.mark.asyncio
async def test_learning_loop_skips_without_minimum_views(monkeypatch):
    service = LearningLoopService()
    short = SimpleNamespace(id=uuid.uuid4(), user_id=uuid.uuid4(), published_at=None)
    analysis = SimpleNamespace(id=uuid.uuid4())

    async def low_metrics(short_id, db):
        return SimpleNamespace(
            views=20,
            average_view_percentage=70,
            engagement_rate=8,
        )

    monkeypatch.setattr(service, "_latest_metrics", low_metrics)

    can_learn, reason = await service.can_learn_from_short(short, analysis, db=None)

    assert can_learn is False
    assert reason == "not_enough_views"


@pytest.mark.asyncio
async def test_learning_loop_accepts_valid_short(monkeypatch):
    service = LearningLoopService()
    short = SimpleNamespace(
        id=uuid.uuid4(),
        user_id=uuid.uuid4(),
        published_at=datetime.now(timezone.utc) - timedelta(hours=12),
    )
    analysis = SimpleNamespace(id=uuid.uuid4())

    async def valid_metrics(short_id, db):
        return SimpleNamespace(
            views=500,
            average_view_percentage=72,
            engagement_rate=9,
        )

    async def enough_analyses(user_id, db):
        return 2

    monkeypatch.setattr(service, "_latest_metrics", valid_metrics)
    monkeypatch.setattr(service, "_recent_analysis_count", enough_analyses)

    can_learn, reason = await service.can_learn_from_short(short, analysis, db=None)

    assert can_learn is True
    assert reason == "ok"
