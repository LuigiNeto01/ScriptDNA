from app.services.youtube_short_processing_service import _normalize_timed_segments
from app.tasks.youtube_tasks import _parse_srt_segments


def test_normalize_timed_segments_preserves_real_timestamps():
    segments = _normalize_timed_segments(
        [{"start": 1.2, "end": 3.4, "text": "fala real", "timing_source": "real"}],
        timing_source="real",
    )

    assert segments[0]["start"] == 1.2
    assert segments[0]["end"] == 3.4
    assert segments[0]["timing_source"] == "real"


def test_parse_srt_segments_preserves_caption_timing():
    text = """1
00:00:00,000 --> 00:00:03,500
Primeira fala

2
00:00:03,500 --> 00:00:07,000
Segunda fala
"""

    segments = _parse_srt_segments(text)

    assert len(segments) == 2
    assert segments[0]["start"] == 0
    assert segments[0]["end"] == 3.5
    assert segments[0]["timing_source"] == "real"
