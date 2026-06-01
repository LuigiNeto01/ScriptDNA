import uuid
from types import SimpleNamespace

import pytest
from pydantic import ValidationError

from app.schemas.generate import ScriptGenerateInput
from app.schemas.script_generation_context import ScriptReference, ScriptReferenceSegment
from app.services.script_generation_context_builder import (
    _summarize_avoid_patterns,
    _summarize_winning_patterns,
    _avg,
    split_insights,
)


def _insight(sentiment: str, confidence: float = 0.8):
    return SimpleNamespace(
        id=uuid.uuid4(),
        category="hook",
        sentiment=sentiment,
        title=f"{sentiment} insight",
        description="descricao",
        confidence=confidence,
        evidence=[{"metric": "retention"}],
    )


def test_split_insights_into_do_avoid_watch_out():
    buckets = split_insights(
        [
            _insight("positive", 0.9),
            _insight("negative", 0.9),
            _insight("neutral", 0.9),
            _insight("positive", 0.4),
        ]
    )

    assert len(buckets["do"]) == 1
    assert len(buckets["avoid"]) == 1
    assert len(buckets["watch_out"]) == 2


def test_winning_and_avoid_patterns_are_separated():
    positive = [
        ScriptReference(
            source_type="youtube_short",
            source_id="1",
            segments=[
                ScriptReferenceSegment(
                    text="hook vencedor",
                    beat_type="hook",
                    techniques=["curiosity_gap"],
                ),
                ScriptReferenceSegment(text="cta vencedor", beat_type="cta"),
            ],
        )
    ]
    negative = [
        ScriptReference(
            source_type="youtube_short",
            source_id="2",
            segments=[
                ScriptReferenceSegment(
                    text="hook fraco",
                    beat_type="hook",
                    retention_function="intro longa",
                )
            ],
        )
    ]

    winning = _summarize_winning_patterns(positive)
    avoid = _summarize_avoid_patterns(negative, {"avoid": [{"title": "evite intro"}]})

    assert winning["common_beats"][0] == ("hook", 1)
    assert winning["common_techniques"][0] == ("curiosity_gap", 1)
    assert winning["winning_hooks"] == ["hook vencedor"]
    assert avoid["weak_hooks"] == ["hook fraco"]
    assert avoid["negative_insights"][0]["title"] == "evite intro"


def test_variants_defaults_to_one_and_rejects_more_than_five():
    body = ScriptGenerateInput(theme="Tema valido", duration=45)

    assert body.variants == 1
    with pytest.raises(ValidationError):
        ScriptGenerateInput(theme="Tema valido", duration=45, variants=6)


def test_avg_helper_supports_timing_pattern_summaries():
    assert _avg([0.8, 0.6, None]) == 0.7
    assert _avg([]) is None
