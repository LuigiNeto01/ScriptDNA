from app.services.youtube_short_processing_service import _segment_plain_text


def test_segment_plain_text_estimates_timing_and_positions():
    transcript = "um dois tres quatro cinco seis sete oito nove dez"

    segments = _segment_plain_text(
        transcript,
        duration_seconds=20,
        timing_source="estimated",
        words_per_segment=4,
    )

    assert len(segments) == 3
    assert segments[0]["text"] == "um dois tres quatro"
    assert segments[0]["start"] == 0
    assert segments[0]["end"] == 8
    assert segments[0]["word_count"] == 4
    assert segments[0]["position_percent"] == 40
    assert segments[-1]["position_percent"] == 100
    assert all(segment["timing_source"] == "estimated" for segment in segments)


def test_segment_plain_text_returns_empty_for_blank_transcript():
    assert _segment_plain_text("", duration_seconds=30) == []
