import uuid
from datetime import datetime, timezone

from app.models import (
    BeatType,
    ScriptBeat,
    StyleProfile,
    TranscriptSegment,
    Video,
    VideoStatus,
)


class VideoFactory:
    @staticmethod
    def create(
        title: str = "Test Video",
        source_type: str = "text",
        creator_name: str = "Test Creator",
        niche: str = "tech",
        status: VideoStatus = VideoStatus.DONE,
        **kwargs,
    ) -> Video:
        return Video(
            id=kwargs.get("id", uuid.uuid4()),
            title=title,
            source_type=source_type,
            creator_name=creator_name,
            niche=niche,
            status=status,
            **{k: v for k, v in kwargs.items() if k != "id"},
        )


class TranscriptSegmentFactory:
    @staticmethod
    def create(
        video_id: uuid.UUID | None = None,
        start_time: float = 0.0,
        end_time: float = 5.0,
        text: str = "Este é um segmento de teste para análise.",
        **kwargs,
    ) -> TranscriptSegment:
        return TranscriptSegment(
            id=kwargs.get("id", uuid.uuid4()),
            video_id=video_id or uuid.uuid4(),
            start_time=start_time,
            end_time=end_time,
            text=text,
            word_count=len(text.split()),
            position_percent=kwargs.get("position_percent", 0.0),
        )


class ScriptBeatFactory:
    @staticmethod
    def create(
        video_id: uuid.UUID | None = None,
        beat_type: BeatType = BeatType.HOOK,
        **kwargs,
    ) -> ScriptBeat:
        return ScriptBeat(
            id=kwargs.get("id", uuid.uuid4()),
            video_id=video_id or uuid.uuid4(),
            beat_type=beat_type,
            attention_goal=kwargs.get("attention_goal", "Capturar atenção"),
            emotion=kwargs.get("emotion", "curiosidade"),
            intensity_score=kwargs.get("intensity_score", 0.8),
        )


class StyleProfileFactory:
    @staticmethod
    def create(
        name: str = "Test Style",
        **kwargs,
    ) -> StyleProfile:
        return StyleProfile(
            id=kwargs.get("id", uuid.uuid4()),
            name=name,
            description=kwargs.get("description", "Perfil de teste"),
            tone=kwargs.get("tone", "casual"),
            pacing=kwargs.get("pacing", "rápido"),
            avg_sentence_length=kwargs.get("avg_sentence_length", 10.5),
            common_hooks=kwargs.get("common_hooks", ["Você sabia que..."]),
            common_ctas=kwargs.get("common_ctas", ["Se inscreva!"]),
            narrative_patterns=kwargs.get("narrative_patterns", ["hook-conflict-payoff"]),
            do_rules=kwargs.get("do_rules", ["usar perguntas"]),
            avoid_rules=kwargs.get("avoid_rules", ["frases longas"]),
        )
