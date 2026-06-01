import uuid

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.analysis_agent import AnalysisAgent
from app.core.openai_client import get_openai_client
from app.models.youtube import YouTubeShort, YouTubeShortBeat, YouTubeShortSegment


class YouTubeShortProcessingService:
    async def segment_embed_and_analyze(
        self,
        short: YouTubeShort,
        db: AsyncSession,
        timing_source: str = "estimated",
        timed_segments: list[dict] | None = None,
    ) -> dict:
        if not short.transcript:
            return {"segments": 0, "beats": 0}

        await db.execute(
            delete(YouTubeShortBeat).where(YouTubeShortBeat.short_id == short.id)
        )
        await db.execute(
            delete(YouTubeShortSegment).where(YouTubeShortSegment.short_id == short.id)
        )
        await db.flush()

        segments_data = (
            _normalize_timed_segments(timed_segments, timing_source)
            if timed_segments
            else _segment_plain_text(
                short.transcript,
                duration_seconds=short.duration_seconds or 60,
                timing_source=timing_source,
            )
        )
        segments = []
        for item in segments_data:
            segment = YouTubeShortSegment(
                short_id=short.id,
                start_time=item["start"],
                end_time=item["end"],
                text=item["text"],
                word_count=item["word_count"],
                position_percent=item["position_percent"],
                timing_source=item["timing_source"],
            )
            db.add(segment)
            segments.append(segment)
        await db.flush()

        await self._embed_segments(segments)

        beats_saved = await self._analyze_segments(short.id, segments, segments_data, db)
        await db.flush()

        return {"segments": len(segments), "beats": beats_saved}

    async def _embed_segments(self, segments: list[YouTubeShortSegment]) -> None:
        if not segments:
            return

        client = get_openai_client()
        for i in range(0, len(segments), 20):
            batch = segments[i : i + 20]
            response = await client.embeddings.create(
                model="text-embedding-3-small",
                input=[segment.text for segment in batch],
            )
            for segment, emb_data in zip(batch, response.data):
                segment.embedding = emb_data.embedding

    async def _analyze_segments(
        self,
        short_id: uuid.UUID,
        segments: list[YouTubeShortSegment],
        segments_data: list[dict],
        db: AsyncSession,
    ) -> int:
        if not segments:
            return 0

        agent = AnalysisAgent()
        result = await agent.run(segments_data)
        count = 0
        for beat_data in result.get("beats", []):
            idx = beat_data.get("segment_index", 0)
            segment = segments[idx] if idx < len(segments) else None
            beat = YouTubeShortBeat(
                short_id=short_id,
                segment_id=segment.id if segment else None,
                beat_type=beat_data.get("beat_type", "setup"),
                attention_goal=beat_data.get("attention_goal"),
                curiosity_question=beat_data.get("curiosity_question"),
                retention_function=beat_data.get("retention_function"),
                emotion=beat_data.get("emotion"),
                intensity_score=beat_data.get("intensity_score"),
                techniques=beat_data.get("techniques"),
            )
            db.add(beat)
            count += 1
        return count


def _segment_plain_text(
    transcript: str,
    duration_seconds: int,
    timing_source: str = "estimated",
    words_per_segment: int = 45,
) -> list[dict]:
    words = transcript.split()
    if not words:
        return []

    chunks = [
        words[i : i + words_per_segment]
        for i in range(0, len(words), words_per_segment)
    ]
    total_words = len(words)
    duration = max(float(duration_seconds), float(len(chunks) * 3))
    result = []
    consumed = 0
    for chunk in chunks:
        start_ratio = consumed / total_words
        consumed += len(chunk)
        end_ratio = consumed / total_words
        start = duration * start_ratio
        end = duration * end_ratio
        result.append(
            {
                "start": round(start, 2),
                "end": round(end, 2),
                "text": " ".join(chunk),
                "word_count": len(chunk),
                "position_percent": round(end_ratio * 100, 2),
                "timing_source": timing_source,
            }
        )
    return result


def _normalize_timed_segments(
    timed_segments: list[dict] | None,
    timing_source: str,
) -> list[dict]:
    result = []
    for item in timed_segments or []:
        text = str(item.get("text", "")).strip()
        if not text:
            continue
        start = float(item.get("start", 0))
        end = float(item.get("end", start))
        words = text.split()
        result.append(
            {
                "start": round(start, 2),
                "end": round(max(end, start), 2),
                "text": text,
                "word_count": len(words),
                "position_percent": 0,
                "timing_source": item.get("timing_source") or timing_source,
            }
        )
    total_end = max([item["end"] for item in result], default=0) or 1
    for item in result:
        item["position_percent"] = round((item["end"] / total_end) * 100, 2)
    return result
