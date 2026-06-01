import uuid
from dataclasses import dataclass
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.youtube import (
    ShortMetrics,
    YouTubeShort,
    YouTubeShortBeat,
    YouTubeShortSegment,
)


@dataclass
class ReferenceScore:
    source_type: str
    source_id: str
    youtube_video_id: str
    title: str | None
    score: float
    score_reasons: list[str]
    metrics: dict
    segments: list[dict]

    def to_dict(self) -> dict:
        return {
            "source_type": self.source_type,
            "source_id": self.source_id,
            "video_id": self.source_id,
            "youtube_video_id": self.youtube_video_id,
            "title": self.title,
            "score": self.score,
            "score_reasons": self.score_reasons,
            "metrics": self.metrics,
            "segments": self.segments,
        }


class ReferenceScoringService:
    """Ranks user-owned YouTube Shorts with lightweight metric fallbacks."""

    async def get_channel_averages(self, user_id: uuid.UUID, db: AsyncSession) -> dict:
        items = await self._load_user_shorts_with_latest_metrics(user_id, db)
        metrics = [m for _, m in items if m]
        if not metrics:
            return {
                "avg_views": 0,
                "avg_likes": 0,
                "avg_engagement_rate": 0,
                "avg_retention": 0,
                "avg_ctr": 0,
                "avg_subscribers_gained": 0,
            }

        return {
            "avg_views": _avg([m.views for m in metrics]),
            "avg_likes": _avg([m.likes for m in metrics]),
            "avg_engagement_rate": _avg([m.engagement_rate for m in metrics if m.engagement_rate is not None]),
            "avg_retention": _avg([m.average_view_percentage for m in metrics if m.average_view_percentage is not None]),
            "avg_ctr": _avg([m.impressions_ctr for m in metrics if m.impressions_ctr is not None]),
            "avg_subscribers_gained": _avg([m.subscribers_gained for m in metrics]),
        }

    async def rank_references(
        self,
        user_id: uuid.UUID,
        db: AsyncSession,
        niche: str | None = None,
        limit: int = 20,
    ) -> dict:
        averages = await self.get_channel_averages(user_id, db)
        items = await self._load_user_shorts_with_latest_metrics(user_id, db)

        scored = []
        for short, metrics in items:
            if not metrics:
                continue
            score, reasons = self._score(short, metrics, averages)
            scored.append(
                ReferenceScore(
                    source_type="youtube_short",
                    source_id=str(short.id),
                    youtube_video_id=short.youtube_video_id,
                    title=short.title,
                    score=round(score, 4),
                    score_reasons=reasons,
                    metrics=_metrics_to_dict(metrics),
                    segments=await self._load_short_segments(short.id, db),
                )
            )

        scored.sort(key=lambda item: item.score, reverse=True)
        top = scored[:limit]

        return {
            "channel_averages": averages,
            "top_references": [item.to_dict() for item in top],
            "high_retention": [
                item.to_dict()
                for item in top
                if item.metrics.get("average_view_percentage") is not None
                and item.metrics["average_view_percentage"] >= (averages.get("avg_retention") or 0)
            ][:5],
            "high_ctr": [
                item.to_dict()
                for item in top
                if item.metrics.get("impressions_ctr") is not None
                and item.metrics["impressions_ctr"] >= (averages.get("avg_ctr") or 0)
            ][:5],
            "high_subscribers": [
                item.to_dict()
                for item in top
                if item.metrics.get("subscribers_gained", 0) > (averages.get("avg_subscribers_gained") or 0)
            ][:5],
            "high_subscriber_gain": [
                item.to_dict()
                for item in top
                if item.metrics.get("subscribers_gained", 0) > (averages.get("avg_subscribers_gained") or 0)
            ][:5],
            "high_engagement": [
                item.to_dict()
                for item in top
                if item.metrics.get("engagement_rate") is not None
                and item.metrics["engagement_rate"] >= (averages.get("avg_engagement_rate") or 0)
            ][:5],
            "below_average": [
                item.to_dict()
                for item in scored
                if item.metrics.get("average_view_percentage") is not None
                and averages.get("avg_retention", 0) > 0
                and item.metrics["average_view_percentage"] < averages["avg_retention"]
            ][:5],
            "underperforming_to_avoid": [
                item.to_dict()
                for item in scored
                if item.metrics.get("average_view_percentage") is not None
                and averages.get("avg_retention", 0) > 0
                and item.metrics["average_view_percentage"] < averages["avg_retention"]
            ][:5],
            "recent_fast_growth": [
                item.to_dict()
                for item in top
                if item.metrics.get("views", 0) >= (averages.get("avg_views") or 0)
            ][:5],
        }

    def build_prompt_context(self, reference_data: dict) -> str | None:
        parts = ["\n## REFERENCIAS DO CANAL RANQUEADAS POR PERFORMANCE REAL"]
        parts.append("Medias do canal:")
        parts.append(_jsonish(reference_data.get("channel_averages", {})))

        if not reference_data.get("top_references"):
            parts.append("Ainda nao ha Shorts com metricas suficientes para ranquear referencias.")
            return "\n".join(parts)

        sections = [
            ("Videos com alta retencao", "high_retention"),
            ("Videos com alto CTR", "high_ctr"),
            ("Videos com alto ganho de inscritos", "high_subscribers"),
            ("Videos com alto engajamento", "high_engagement"),
            ("Videos recentes com crescimento rapido", "recent_fast_growth"),
            ("Videos abaixo da media para evitar padroes", "below_average"),
        ]
        for title, key in sections:
            items = reference_data.get(key) or []
            if not items:
                continue
            parts.append(f"\n### {title}")
            for item in items:
                parts.append(
                    f"- {item.get('title') or item['youtube_video_id']} "
                    f"(score {item['score']:.2f}): {', '.join(item['score_reasons']) or 'sem motivo forte'}"
                )
                parts.append(f"  metricas: {_jsonish(item.get('metrics', {}))}")
                for segment in (item.get("segments") or [])[:3]:
                    parts.append(f"  trecho: \"{segment.get('text')}\"")
                    if segment.get("beat"):
                        parts.append(f"  beat: {_jsonish(segment['beat'])}")

        return "\n".join(parts)

    async def _load_user_shorts_with_latest_metrics(
        self, user_id: uuid.UUID, db: AsyncSession
    ) -> list[tuple[YouTubeShort, ShortMetrics | None]]:
        result = await db.execute(
            select(YouTubeShort)
            .where(YouTubeShort.user_id == user_id)
            .order_by(YouTubeShort.published_at.desc().nullslast())
            .limit(100)
        )
        shorts = result.scalars().all()

        items = []
        for short in shorts:
            metrics_result = await db.execute(
                select(ShortMetrics)
                .where(ShortMetrics.youtube_short_id == short.id)
                .order_by(ShortMetrics.collected_at.desc())
                .limit(1)
            )
            items.append((short, metrics_result.scalar_one_or_none()))
        return items

    async def _load_short_segments(
        self, short_id: uuid.UUID, db: AsyncSession, limit: int = 5
    ) -> list[dict]:
        result = await db.execute(
            select(YouTubeShortSegment)
            .where(YouTubeShortSegment.short_id == short_id)
            .order_by(YouTubeShortSegment.start_time)
            .limit(limit)
        )
        segments = result.scalars().all()
        if not segments:
            return []

        beat_result = await db.execute(
            select(YouTubeShortBeat).where(
                YouTubeShortBeat.segment_id.in_([segment.id for segment in segments])
            )
        )
        beats = {beat.segment_id: beat for beat in beat_result.scalars().all()}

        payload = []
        for segment in segments:
            beat = beats.get(segment.id)
            item = {
                "id": str(segment.id),
                "text": segment.text,
                "start_time": segment.start_time,
                "end_time": segment.end_time,
                "timing_source": segment.timing_source,
            }
            if beat:
                item["beat"] = {
                    "beat_type": beat.beat_type,
                    "attention_goal": beat.attention_goal,
                    "curiosity_question": beat.curiosity_question,
                    "retention_function": beat.retention_function,
                    "emotion": beat.emotion,
                    "intensity_score": beat.intensity_score,
                    "techniques": beat.techniques,
                }
            payload.append(item)
        return payload

    def _score(self, short: YouTubeShort, metrics: ShortMetrics, averages: dict) -> tuple[float, list[str]]:
        reasons = []
        views_score = _ratio(metrics.views, averages.get("avg_views"))
        likes_score = _ratio(metrics.likes, averages.get("avg_likes"))
        engagement_score = _ratio(metrics.engagement_rate, averages.get("avg_engagement_rate"))
        retention_score = _ratio(metrics.average_view_percentage, averages.get("avg_retention"))
        ctr_score = _ratio(metrics.impressions_ctr, averages.get("avg_ctr"))
        subscriber_score = _ratio(metrics.subscribers_gained, averages.get("avg_subscribers_gained"))
        freshness_score = _freshness_score(short.published_at)

        if retention_score > 1.1:
            reasons.append("retencao acima da media do canal")
        if engagement_score > 1.1:
            reasons.append("engajamento alto")
        if ctr_score > 1.1:
            reasons.append("CTR acima da media")
        if subscriber_score > 1.0 and metrics.subscribers_gained:
            reasons.append("ganhou inscritos")
        if views_score > 1.2:
            reasons.append("views acima da media")

        weighted = (
            _cap(views_score) * 0.20
            + _cap(likes_score) * 0.10
            + _cap(engagement_score) * 0.20
            + _cap(retention_score) * 0.25
            + _cap(ctr_score) * 0.10
            + _cap(subscriber_score) * 0.10
            + freshness_score * 0.05
        )
        return min(weighted / 1.5, 1.0), reasons


def _avg(values: list[float | int | None]) -> float:
    clean = [float(v) for v in values if v is not None]
    return sum(clean) / len(clean) if clean else 0


def _ratio(value: float | int | None, average: float | int | None) -> float:
    if value is None:
        return 0.5
    if not average or average <= 0:
        return 1.0 if value else 0.5
    return float(value) / float(average)


def _cap(value: float) -> float:
    return max(0.0, min(value, 2.0))


def _freshness_score(published_at: datetime | None) -> float:
    if not published_at:
        return 0.5
    now = datetime.now(timezone.utc)
    published = published_at if published_at.tzinfo else published_at.replace(tzinfo=timezone.utc)
    age_days = max((now - published).days, 0)
    if age_days <= 30:
        return 1.0
    if age_days <= 180:
        return 0.7
    return 0.4


def _metrics_to_dict(metrics: ShortMetrics) -> dict:
    return {
        "views": metrics.views,
        "likes": metrics.likes,
        "comments": metrics.comments,
        "shares": metrics.shares,
        "subscribers_gained": metrics.subscribers_gained,
        "average_view_duration_seconds": metrics.average_view_duration_seconds,
        "average_view_percentage": metrics.average_view_percentage,
        "impressions": metrics.impressions,
        "impressions_ctr": metrics.impressions_ctr,
        "engagement_rate": metrics.engagement_rate,
        "retention_score": metrics.retention_score,
        "source": metrics.source,
        "collected_at": metrics.collected_at.isoformat() if metrics.collected_at else None,
    }


def _excerpt(text: str | None, limit: int = 500) -> str | None:
    if not text:
        return None
    compact = " ".join(text.split())
    return compact[:limit]


def _jsonish(data: dict) -> str:
    return ", ".join(f"{key}={value}" for key, value in data.items())
