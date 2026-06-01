import logging
import uuid
from collections import Counter

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.openai_client import get_openai_client
from app.models import StyleProfile, TranscriptSegment, Video, YouTubeShort, YouTubeShortBeat, YouTubeShortSegment
from app.models.performance_analysis import PerformanceAnalysis
from app.models.insight import ChannelInsight
from app.schemas.generate import ScriptGenerateInput
from app.schemas.script_generation_context import (
    ScriptGenerationContext,
    ScriptReference,
    ScriptReferenceSegment,
)
from app.services.context_cache import get_cached, set_cached
from app.services.reference_scoring_service import ReferenceScoringService

logger = logging.getLogger(__name__)


class ScriptGenerationContextBuilder:
    async def build(
        self,
        body: ScriptGenerateInput,
        user_id: uuid.UUID,
        db: AsyncSession,
    ) -> ScriptGenerationContext:
        # Try cache for reference data (expensive query)
        cache_params = f"niche={body.niche}"
        reference_data = await get_cached(user_id, "references", cache_params)
        if not reference_data:
            reference_service = ReferenceScoringService()
            reference_data = await reference_service.rank_references(
                user_id, db, niche=body.niche
            )
            await set_cached(user_id, "references", reference_data, cache_params, ttl=300)
        positive = _dedupe_references(
            reference_data.get("high_retention", [])
            + reference_data.get("high_ctr", [])
            + reference_data.get("high_subscriber_gain", [])
            + reference_data.get("high_engagement", [])
            + reference_data.get("recent_fast_growth", [])
        )
        negative = _dedupe_references(
            reference_data.get("underperforming_to_avoid", [])
            or reference_data.get("below_average", [])
        )

        context = ScriptGenerationContext(
            brief=_brief_from_input(body),
            channel_baselines=reference_data.get("channel_averages", {}),
            positive_references=[_reference_from_dict(item) for item in positive[:10]],
            negative_references=[_reference_from_dict(item) for item in negative[:5]],
            semantic_segments=await self._semantic_segments(body, user_id, db),
            active_insights=await self._active_insights(body, user_id, db),
            style_profile=await self._style_profile(body.style_profile_id, user_id, db),
            timing_patterns=await self._timing_patterns(user_id, db),
        )
        context.winning_patterns = _summarize_winning_patterns(
            context.positive_references
        )
        context.avoid_patterns = _summarize_avoid_patterns(
            context.negative_references, context.active_insights
        )
        return context

    async def _timing_patterns(self, user_id: uuid.UUID, db: AsyncSession) -> dict:
        cached = await get_cached(user_id, "timing_patterns")
        if cached:
            return cached

        rows = (
            await db.execute(
                select(PerformanceAnalysis)
                .join(YouTubeShort, PerformanceAnalysis.youtube_short_id == YouTubeShort.id)
                .where(
                    YouTubeShort.user_id == user_id,
                    PerformanceAnalysis.timeline_analysis.isnot(None),
                )
                .order_by(PerformanceAnalysis.created_at.desc())
                .limit(20)
            )
        ).scalars().all()
        if not rows:
            return {}

        hook_scores = []
        setup_drops = []
        payoff_positions = []
        cta_scores = []
        for analysis in rows:
            beat_scores = analysis.beat_scores or {}
            if beat_scores.get("hook") is not None:
                hook_scores.append(beat_scores["hook"])
            if beat_scores.get("cta") is not None:
                cta_scores.append(beat_scores["cta"])
            timeline = analysis.timeline_analysis or {}
            for item in timeline.get("drop_moments", []):
                if item.get("beat_type") == "setup":
                    setup_drops.append(item.get("end_time"))
            for item in timeline.get("strong_moments", []):
                if item.get("beat_type") == "payoff":
                    payoff_positions.append(item.get("start_time"))

        result = {
            "best_hook_duration": "0-3s" if _avg(hook_scores) and _avg(hook_scores) >= 0.7 else None,
            "avoid_setup_longer_than": "8s" if any((value or 0) >= 8 for value in setup_drops) else None,
            "best_payoff_position": "70-85%" if payoff_positions else None,
            "cta_best_position": "before_final_payoff" if _avg(cta_scores) and _avg(cta_scores) < 0.6 else None,
        }
        await set_cached(user_id, "timing_patterns", result, ttl=600)
        return result

    async def _semantic_segments(
        self,
        body: ScriptGenerateInput,
        user_id: uuid.UUID,
        db: AsyncSession,
        limit: int = 8,
    ) -> list[ScriptReferenceSegment]:
        client = get_openai_client()
        response = await client.embeddings.create(
            model="text-embedding-3-small",
            input=body.theme,
        )
        query_embedding = response.data[0].embedding

        results = []
        short_rows = (
            await db.execute(
                select(
                    YouTubeShortSegment,
                    YouTubeShortSegment.embedding.cosine_distance(query_embedding).label("distance"),
                )
                .join(YouTubeShort, YouTubeShortSegment.short_id == YouTubeShort.id)
                .where(
                    YouTubeShort.user_id == user_id,
                    YouTubeShortSegment.embedding.isnot(None),
                )
                .order_by("distance")
                .limit(limit)
            )
        ).all()

        short_segment_ids = [segment.id for segment, _ in short_rows]
        beats = {}
        if short_segment_ids:
            beat_rows = await db.execute(
                select(YouTubeShortBeat).where(
                    YouTubeShortBeat.segment_id.in_(short_segment_ids)
                )
            )
            beats = {beat.segment_id: beat for beat in beat_rows.scalars().all()}

        for segment, _ in short_rows:
            results.append(_short_segment_to_context(segment, beats.get(segment.id)))

        uploaded_rows = (
            await db.execute(
                select(
                    TranscriptSegment,
                    TranscriptSegment.embedding.cosine_distance(query_embedding).label("distance"),
                )
                .join(Video, TranscriptSegment.video_id == Video.id)
                .where(
                    TranscriptSegment.embedding.isnot(None),
                    or_(Video.user_id == user_id, Video.visibility == "public"),
                )
                .order_by("distance")
                .limit(limit)
            )
        ).all()
        for segment, _ in uploaded_rows:
            results.append(
                ScriptReferenceSegment(
                    text=segment.text,
                    start_time=segment.start_time,
                    end_time=segment.end_time,
                )
            )

        return results[:limit]

    async def _active_insights(
        self,
        body: ScriptGenerateInput,
        user_id: uuid.UUID,
        db: AsyncSession,
    ) -> dict:
        query_embedding = None
        try:
            client = get_openai_client()
            response = await client.embeddings.create(
                model="text-embedding-3-small",
                input=body.theme,
            )
            query_embedding = response.data[0].embedding
        except Exception:
            query_embedding = None

        stmt = (
            select(ChannelInsight)
            .where(
                ChannelInsight.user_id == user_id,
                ChannelInsight.is_active == True,  # noqa: E712
                ChannelInsight.confidence >= 0.25,
            )
            .limit(20)
        )
        if body.niche:
            stmt = stmt.where(
                or_(ChannelInsight.niche == body.niche, ChannelInsight.niche.is_(None))
            )
        if query_embedding:
            stmt = stmt.order_by(
                ChannelInsight.embedding.cosine_distance(query_embedding).nullslast(),
                ChannelInsight.confidence.desc(),
                ChannelInsight.updated_at.desc(),
            )
        else:
            stmt = stmt.order_by(
                ChannelInsight.confidence.desc(), ChannelInsight.updated_at.desc()
            )

        rows = (await db.execute(stmt)).scalars().all()
        return split_insights(rows)

    async def _style_profile(
        self,
        style_profile_id: uuid.UUID | None,
        user_id: uuid.UUID,
        db: AsyncSession,
    ) -> dict | None:
        if not style_profile_id:
            return None
        profile = await db.get(StyleProfile, style_profile_id)
        if not profile or (
            profile.user_id != user_id and profile.visibility != "public"
        ):
            return None
        return {
            "id": str(profile.id),
            "name": profile.name,
            "tone": profile.tone,
            "pacing": profile.pacing,
            "avg_sentence_length": profile.avg_sentence_length,
            "common_hooks": profile.common_hooks or [],
            "common_ctas": profile.common_ctas or [],
            "narrative_patterns": profile.narrative_patterns or [],
            "do_rules": profile.do_rules or [],
            "avoid_rules": profile.avoid_rules or [],
        }


def split_insights(insights: list) -> dict:
    buckets = {"do": [], "avoid": [], "watch_out": []}
    for insight in insights:
        item = {
            "id": str(insight.id),
            "category": getattr(insight.category, "value", insight.category),
            "sentiment": getattr(insight.sentiment, "value", insight.sentiment),
            "title": insight.title,
            "description": insight.description,
            "confidence": insight.confidence,
            "evidence": insight.evidence or [],
        }
        sentiment = item["sentiment"]
        if sentiment == "positive" and insight.confidence >= 0.55:
            buckets["do"].append(item)
        elif sentiment == "negative":
            buckets["avoid"].append(item)
        else:
            buckets["watch_out"].append(item)
    return buckets


def _brief_from_input(body: ScriptGenerateInput) -> dict:
    return {
        "theme": body.theme,
        "idea": body.idea,
        "duration": body.duration,
        "niche": body.niche,
        "goal": body.goal,
        "hook_type": body.hook_type,
        "aggressiveness": body.aggressiveness,
        "cta": body.cta,
        "platform": body.platform,
        "variants": body.variants,
    }


def _reference_from_dict(item: dict) -> ScriptReference:
    return ScriptReference(
        source_type=item.get("source_type", "youtube_short"),
        source_id=str(item.get("source_id") or item.get("video_id")),
        title=item.get("title"),
        score=item.get("score") or 0,
        score_reasons=item.get("score_reasons") or [],
        metrics=item.get("metrics") or {},
        segments=[
            _reference_segment_from_dict(segment)
            for segment in item.get("segments", [])
        ],
    )


def _reference_segment_from_dict(item: dict) -> ScriptReferenceSegment:
    beat = item.get("beat") or {}
    techniques = beat.get("techniques") or item.get("techniques") or []
    return ScriptReferenceSegment(
        text=item.get("text", ""),
        start_time=item.get("start_time"),
        end_time=item.get("end_time"),
        beat_type=beat.get("beat_type") or item.get("beat_type"),
        techniques=_technique_names(techniques),
        emotion=beat.get("emotion") or item.get("emotion"),
        intensity_score=beat.get("intensity_score") or item.get("intensity_score"),
        retention_function=beat.get("retention_function") or item.get("retention_function"),
        curiosity_question=beat.get("curiosity_question") or item.get("curiosity_question"),
    )


def _short_segment_to_context(
    segment: YouTubeShortSegment, beat: YouTubeShortBeat | None
) -> ScriptReferenceSegment:
    return ScriptReferenceSegment(
        text=segment.text,
        start_time=segment.start_time,
        end_time=segment.end_time,
        beat_type=beat.beat_type if beat else None,
        techniques=_technique_names(beat.techniques if beat else []),
        emotion=beat.emotion if beat else None,
        intensity_score=beat.intensity_score if beat else None,
        retention_function=beat.retention_function if beat else None,
        curiosity_question=beat.curiosity_question if beat else None,
    )


def _summarize_winning_patterns(references: list[ScriptReference]) -> dict:
    beats = Counter()
    techniques = Counter()
    hooks = []
    ctas = []
    for reference in references:
        for segment in reference.segments:
            if segment.beat_type:
                beats[segment.beat_type] += 1
            for technique in segment.techniques:
                techniques[technique] += 1
            if segment.beat_type == "hook":
                hooks.append(segment.text)
            if segment.beat_type == "cta":
                ctas.append(segment.text)
    return {
        "common_beats": beats.most_common(8),
        "common_techniques": techniques.most_common(8),
        "winning_hooks": hooks[:5],
        "winning_ctas": ctas[:5],
    }


def _summarize_avoid_patterns(
    references: list[ScriptReference], active_insights: dict
) -> dict:
    weak_hooks = []
    weak_ctas = []
    low_retention_structures = []
    for reference in references:
        for segment in reference.segments:
            if segment.beat_type == "hook":
                weak_hooks.append(segment.text)
            elif segment.beat_type == "cta":
                weak_ctas.append(segment.text)
            elif segment.retention_function:
                low_retention_structures.append(segment.retention_function)
    return {
        "weak_hooks": weak_hooks[:5],
        "weak_ctas": weak_ctas[:5],
        "low_retention_structures": low_retention_structures[:5],
        "negative_insights": active_insights.get("avoid", []),
    }


def _dedupe_references(items: list[dict]) -> list[dict]:
    seen = set()
    result = []
    for item in items:
        key = item.get("source_id") or item.get("video_id")
        if key in seen:
            continue
        seen.add(key)
        result.append(item)
    return result


def _technique_names(techniques: list) -> list[str]:
    names = []
    for technique in techniques or []:
        if isinstance(technique, str):
            names.append(technique)
        elif isinstance(technique, dict):
            name = technique.get("name") or technique.get("technique")
            if name:
                names.append(str(name))
    return names


def _avg(values: list[float]) -> float | None:
    clean = [value for value in values if value is not None]
    return sum(clean) / len(clean) if clean else None
