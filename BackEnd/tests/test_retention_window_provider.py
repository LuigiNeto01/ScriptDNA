from types import SimpleNamespace

from app.services.retention_window_provider import RetentionWindowProvider


def test_retention_window_provider_returns_template_without_fake_metrics():
    short = SimpleNamespace(duration_seconds=60)

    windows = RetentionWindowProvider().empty_template(short.duration_seconds)

    assert windows
    assert windows[0].start_time == 0
    assert windows[0].end_time == 3
    assert all(window.source == "template" for window in windows)
    assert all(window.retention_percentage is None for window in windows)
