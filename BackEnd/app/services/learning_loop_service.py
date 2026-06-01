import logging
import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.learning_memory_agent import LearningMemoryAgent
from app.core.openai_client import get_openai_client
from app.models import (
    ChannelInsight,
    InsightCategory,
    InsightSentiment,
    LearningEvent,
    PerformanceAnalysis,
    ShortMetrics,
    YouTubeShort,
)
from app.models.youtube_short_comment import YouTubeShortComment

logger = logging.getLogger(__name__)


class LearningLoopService:
    min_views = 100
    min_age_hours = 6
    min_recent_analyses = 2
    insight_min_active_confidence = 0.25

    async def maybe_update_after_analysis(
        self,
        user_id: uuid.UUID,
        short: YouTubeShort,
        analysis: PerformanceAnalysis,
        db: AsyncSession,
    ) -> dict:
        can_learn, reason = await self.can_learn_from_short(short, analysis, db)
        if not can_learn:
            logger.info("Learning skipped for short %s: %s", short.id, reason)
            return {"status": "skipped", "reason": reason}

        existing_event = await self._existing_event(analysis.id, db)
        if existing_event and existing_event.status == "completed":
            return {"status": "skipped", "reason": "already_processed"}

        event = existing_event or LearningEvent(
            user_id=user_id,
            short_id=short.id,
            performance_analysis_id=analysis.id,
            event_type="performance_analysis",
            status="running",
            metadata_json={},
        )
        event.status = "running"
        db.add(event)
        await db.flush()

        try:
            result = await self._consolidate_insights(user_id, db)
            await self.apply_temporal_decay(user_id, db)
            event.status = "completed"
            event.completed_at = datetime.now(timezone.utc)
            event.metadata_json = {
                **(event.metadata_json or {}),
                **result,
                "source": "performance_analysis",
            }
            await db.flush()
            logger.info("Learning completed for short %s", short.id)
            return {"status": "completed", **result}
        except Exception as exc:
            event.status = "failed"
            event.error_message = str(exc)
            await db.flush()
            logger.exception("Learning failed for short %s", short.id)
            return {"status": "failed", "error": str(exc)}

    async def can_learn_from_short(
        self,
        short: YouTubeShort,
        analysis: PerformanceAnalysis | None,
        db: AsyncSession,
    ) -> tuple[bool, str]:
        if not analysis:
            return False, "missing_performance_analysis"

        metrics = await self._latest_metrics(short.id, db)
        if not metrics:
            return False, "missing_metrics"
        if metrics.views < self.min_views:
            return False, "not_enough_views"
        if not (metrics.average_view_percentage is not None or metrics.engagement_rate is not None):
            return False, "missing_retention_or_engagement"
        if short.published_at:
            published = short.published_at
            if published.tzinfo is None:
                published = published.replace(tzinfo=timezone.utc)
            age_hours = (datetime.now(timezone.utc) - published).total_seconds() / 3600
            if age_hours < self.min_age_hours:
                return False, "too_recent"

        recent_count = await self._recent_analysis_count(short.user_id, db)
        if recent_count < self.min_recent_analyses:
            return False, "not_enough_analyses"
        return True, "ok"

    async def apply_temporal_decay(self, user_id: uuid.UUID, db: AsyncSession) -> int:
        rows = (
            await db.execute(select(ChannelInsight).where(ChannelInsight.user_id == user_id))
        ).scalars().all()
        decayed = 0
        now = datetime.now(timezone.utc)
        for insight in rows:
            updated = insight.updated_at or insight.created_at
            if updated and updated.tzinfo is None:
                updated = updated.replace(tzinfo=timezone.utc)
            age_days = (now - updated).days if updated else 0
            if age_days < 90:
                continue
            insight.confidence = max(0.0, insight.confidence - 0.05)
            decayed += 1
            if insight.confidence < self.insight_min_active_confidence:
                insight.is_active = False
        return decayed

    async def _consolidate_insights(self, user_id: uuid.UUID, db: AsyncSession) -> dict:
        analyses = (
            await db.execute(
                select(PerformanceAnalysis)
                .join(YouTubeShort, PerformanceAnalysis.youtube_short_id == YouTubeShort.id)
                .where(YouTubeShort.user_id == user_id)
                .order_by(PerformanceAnalysis.created_at.desc())
                .limit(20)
            )
        ).scalars().all()

        if len(analyses) < self.min_recent_analyses:
            return {"new_insights": 0, "updated_insights": 0, "deactivated_insights": 0}

        recent_analyses = [_analysis_payload(item) for item in analyses]
        existing = [
            _insight_payload(item)
            for item in (
                await db.execute(select(ChannelInsight).where(ChannelInsight.user_id == user_id))
            ).scalars().all()
        ]

        result_data = await LearningMemoryAgent().run(
            recent_analyses=recent_analyses,
            existing_insights=existing,
        )

        return await self.persist_agent_result(user_id, result_data, db)

    async def persist_agent_result(
        self,
        user_id: uuid.UUID,
        result_data: dict,
        db: AsyncSession,
    ) -> dict:
        new_count = 0
        for insight in result_data.get("new_insights", []):
            title = insight.get("title") or insight.get("claim") or ""
            description = insight.get("description") or insight.get("recommended_action") or title
            if not title or await self._similar_insight_exists(user_id, title, db):
                continue
            ci = ChannelInsight(
                user_id=user_id,
                category=_category(insight.get("category")),
                sentiment=_sentiment(insight.get("sentiment")),
                title=title[:500],
                description=description,
                evidence=insight.get("evidence") or [],
                niche=insight.get("niche") or insight.get("applies_to_niche"),
                theme=insight.get("theme"),
                confidence=insight.get("confidence", 0.5),
                times_validated=insight.get("times_validated", 1),
                embedding=await _embedding_for_insight(title, description),
            )
            db.add(ci)
            new_count += 1

        updated_count = 0
        for update in result_data.get("updated_insights", []):
            insight_id = _uuid_or_none(update.get("id"))
            if not insight_id:
                continue
            ci = await db.get(ChannelInsight, insight_id)
            if not ci or ci.user_id != user_id:
                continue
            action = update.get("action")
            if action == "validate":
                ci.confidence = min(update.get("new_confidence", ci.confidence + 0.08), 1.0)
                ci.times_validated = update.get("new_times_validated", ci.times_validated + 1)
                if update.get("evidence"):
                    ci.evidence = (ci.evidence or []) + update["evidence"]
            elif action == "invalidate":
                ci.confidence = max(update.get("new_confidence", ci.confidence - 0.12), 0.0)
                if ci.confidence < self.insight_min_active_confidence:
                    ci.is_active = False
            elif action == "update":
                ci.description = update.get("description", ci.description)
            updated_count += 1

        deactivated_count = 0
        for item in result_data.get("deactivated_insights", []):
            insight_id = _uuid_or_none(item.get("id"))
            if not insight_id:
                continue
            ci = await db.get(ChannelInsight, insight_id)
            if ci and ci.user_id == user_id:
                ci.is_active = False
                deactivated_count += 1

        return {
            "new_insights": new_count,
            "updated_insights": updated_count,
            "deactivated_insights": deactivated_count,
        }

    async def _existing_event(
        self, performance_analysis_id: uuid.UUID, db: AsyncSession
    ) -> LearningEvent | None:
        result = await db.execute(
            select(LearningEvent).where(
                LearningEvent.performance_analysis_id == performance_analysis_id,
                LearningEvent.event_type == "performance_analysis",
            )
        )
        return result.scalar_one_or_none()

    async def _latest_metrics(
        self, short_id: uuid.UUID, db: AsyncSession
    ) -> ShortMetrics | None:
        result = await db.execute(
            select(ShortMetrics)
            .where(ShortMetrics.youtube_short_id == short_id)
            .order_by(ShortMetrics.collected_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def _recent_analysis_count(self, user_id: uuid.UUID, db: AsyncSession) -> int:
        result = await db.execute(
            select(PerformanceAnalysis)
            .join(YouTubeShort, PerformanceAnalysis.youtube_short_id == YouTubeShort.id)
            .where(YouTubeShort.user_id == user_id)
            .limit(self.min_recent_analyses)
        )
        return len(result.scalars().all())

    min_comments_for_learning = 5
    comment_confidence_modifier = 0.6  # moderate impact vs performance analysis

    async def maybe_learn_from_comments(
        self,
        user_id: uuid.UUID,
        short: YouTubeShort,
        comment_summary: dict,
        db: AsyncSession,
    ) -> dict:
        """Feed comment analysis into learning loop when >=5 comments exist."""
        total = comment_summary.get("total_analyzed", 0)
        if total < self.min_comments_for_learning:
            return {"status": "skipped", "reason": "not_enough_comments", "count": total}

        # Build synthetic learnings from comment summary
        new_insights = []

        # Content strengths from comments
        for strength in comment_summary.get("content_strengths", []):
            new_insights.append({
                "category": "audience",
                "sentiment": "positive",
                "title": f"Audiencia aprova: {strength}",
                "description": f"Comentarios indicam que '{strength}' e bem recebido pelo publico.",
                "evidence": [{"source": "comments", "short_id": str(short.id), "metric": "comment_sentiment", "value": strength}],
                "confidence": 0.5 * self.comment_confidence_modifier,
                "times_validated": 1,
                "recommended_action": f"Manter e reforcar '{strength}' em roteiros futuros.",
            })

        # Content weaknesses from comments
        for weakness in comment_summary.get("content_weaknesses", []):
            new_insights.append({
                "category": "audience",
                "sentiment": "negative",
                "title": f"Audiencia critica: {weakness}",
                "description": f"Comentarios indicam problemas com '{weakness}'.",
                "evidence": [{"source": "comments", "short_id": str(short.id), "metric": "comment_sentiment", "value": weakness}],
                "confidence": 0.4 * self.comment_confidence_modifier,
                "times_validated": 1,
                "recommended_action": f"Melhorar '{weakness}' nos proximos roteiros.",
            })

        # Audience requests as insights
        for request in comment_summary.get("audience_requests", []):
            new_insights.append({
                "category": "topic",
                "sentiment": "positive",
                "title": f"Pedido de audiencia: {request}",
                "description": f"Espectadores pediram '{request}' nos comentarios.",
                "evidence": [{"source": "comments", "short_id": str(short.id), "metric": "audience_request", "value": request}],
                "confidence": 0.45 * self.comment_confidence_modifier,
                "times_validated": 1,
                "recommended_action": f"Considerar criar conteudo sobre '{request}'.",
            })

        if not new_insights:
            return {"status": "completed", "new_insights": 0, "reason": "no_actionable_insights"}

        result_data = {"new_insights": new_insights, "updated_insights": [], "deactivated_insights": []}
        counts = await self.persist_agent_result(user_id, result_data, db)
        return {"status": "completed", **counts}

    async def _similar_insight_exists(
        self, user_id: uuid.UUID, title: str, db: AsyncSession
    ) -> bool:
        normalized = title.strip().lower()
        result = await db.execute(
            select(ChannelInsight).where(ChannelInsight.user_id == user_id)
        )
        for item in result.scalars().all():
            if item.title.strip().lower() == normalized:
                return True
        return False


def _analysis_payload(analysis: PerformanceAnalysis) -> dict:
    return {
        "id": str(analysis.id),
        "short_id": str(analysis.youtube_short_id),
        "overall_score": analysis.overall_score,
        "scores": {
            "hook": analysis.hook_score,
            "rhythm": analysis.rhythm_score,
            "curiosity": analysis.curiosity_score,
            "retention": analysis.retention_score,
            "clarity": analysis.clarity_score,
            "cta": analysis.cta_score,
            "overall": analysis.overall_score,
        },
        "strengths": analysis.strengths,
        "weaknesses": analysis.weaknesses,
        "actionable_learnings": analysis.actionable_learnings,
        "script_correlation": analysis.script_correlation,
        "script_adherence": analysis.script_adherence,
        "timeline_analysis": analysis.timeline_analysis,
        "beat_scores": analysis.beat_scores,
    }


def _insight_payload(insight: ChannelInsight) -> dict:
    return {
        "id": str(insight.id),
        "title": insight.title,
        "description": insight.description,
        "category": insight.category.value,
        "sentiment": insight.sentiment.value,
        "confidence": insight.confidence,
        "times_validated": insight.times_validated,
        "evidence": insight.evidence or [],
    }


def _category(value: str | None) -> InsightCategory:
    try:
        return InsightCategory(value or "general")
    except ValueError:
        return InsightCategory.GENERAL


def _sentiment(value: str | None) -> InsightSentiment:
    try:
        return InsightSentiment(value or "neutral")
    except ValueError:
        return InsightSentiment.NEUTRAL


def _uuid_or_none(value) -> uuid.UUID | None:
    try:
        return uuid.UUID(str(value))
    except (TypeError, ValueError):
        return None


async def _embedding_for_insight(title: str, description: str) -> list | None:
    try:
        client = get_openai_client()
        response = await client.embeddings.create(
            model="text-embedding-3-small",
            input=f"{title} {description}",
        )
        return response.data[0].embedding
    except Exception:
        return None
