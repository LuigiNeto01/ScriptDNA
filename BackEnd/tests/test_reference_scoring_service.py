from datetime import datetime, timezone
from types import SimpleNamespace

from app.services.reference_scoring_service import ReferenceScoringService


def test_reference_score_uses_real_metric_signals():
    service = ReferenceScoringService()
    short = SimpleNamespace(published_at=datetime.now(timezone.utc))
    metrics = SimpleNamespace(
        views=2000,
        likes=200,
        engagement_rate=0.16,
        average_view_percentage=82.0,
        impressions_ctr=9.5,
        subscribers_gained=12,
    )
    averages = {
        "avg_views": 1000,
        "avg_likes": 100,
        "avg_engagement_rate": 0.08,
        "avg_retention": 60.0,
        "avg_ctr": 5.0,
        "avg_subscribers_gained": 3,
    }

    score, reasons = service._score(short, metrics, averages)

    assert 0.8 <= score <= 1.0
    assert "retencao acima da media do canal" in reasons
    assert "engajamento alto" in reasons
    assert "CTR acima da media" in reasons
    assert "ganhou inscritos" in reasons
    assert "views acima da media" in reasons


def test_reference_score_works_with_missing_metrics():
    service = ReferenceScoringService()
    short = SimpleNamespace(published_at=None)
    metrics = SimpleNamespace(
        views=0,
        likes=0,
        engagement_rate=None,
        average_view_percentage=None,
        impressions_ctr=None,
        subscribers_gained=0,
    )
    averages = {}

    score, reasons = service._score(short, metrics, averages)

    assert 0 <= score <= 1
    assert reasons == []
