import uuid
from types import SimpleNamespace

from app.services.retention_window_provider import RetentionWindow
from app.services.timeline_analysis_service import TimelineAnalysisService


def test_timeline_analysis_detects_drop_and_beat_scores():
    hook_id = uuid.uuid4()
    setup_id = uuid.uuid4()
    segments = [
        SimpleNamespace(id=hook_id, start_time=0, end_time=3, text="hook forte"),
        SimpleNamespace(id=setup_id, start_time=8, end_time=14, text="setup longo"),
    ]
    beats = [
        SimpleNamespace(segment_id=hook_id, beat_type="hook", retention_function="abrir curiosidade"),
        SimpleNamespace(segment_id=setup_id, beat_type="setup", retention_function="contextualizar"),
    ]
    windows = [
        RetentionWindow(0, 3, relative_retention=1.2, drop_rate=0.02, source="manual"),
        RetentionWindow(8, 14, relative_retention=0.7, drop_rate=0.24, source="manual"),
    ]
    script_lines = [
        {"start": "0", "end": "3", "line": "hook planejado"},
        {"start": "8", "end": "14", "line": "setup planejado"},
    ]

    result = TimelineAnalysisService().analyze(script_lines, segments, beats, windows)

    assert result["strong_moments"][0]["beat_type"] == "hook"
    assert result["drop_moments"][0]["beat_type"] == "setup"
    assert result["beat_scores"]["hook"] == 1
    assert result["beat_scores"]["setup"] < 1
