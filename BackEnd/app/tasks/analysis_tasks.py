import asyncio
import uuid

from sqlalchemy import func, select

from app.agents.channel_strategy_agent import ChannelStrategyAgent
from app.agents.learning_memory_agent import LearningMemoryAgent
from app.agents.performance_analysis_agent import PerformanceAnalysisAgent
from app.core.celery_app import celery_app
from app.core.openai_client import get_openai_client
from app.db.session import make_session_factory
from app.models.insight import ChannelInsight, InsightCategory, InsightSentiment
from app.models.performance_analysis import PerformanceAnalysis
from app.models.script import Script, ScriptVersion
from app.models.suggestion import SuggestionCategory, VideoSuggestion
from app.models.user import User
from app.models.youtube import ShortMetrics, YouTubeShort


def _run_async(coro):
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@celery_app.task(name="app.tasks.analysis_tasks.analyze_short_performance", bind=True, max_retries=3)
def analyze_short_performance(self, user_id: str, short_id: str):
    """Analyze performance of a specific Short using AI."""
    return _run_async(_analyze_short_performance(self, user_id, short_id))


async def _analyze_short_performance(task, user_id: str, short_id: str):
    session_factory = make_session_factory()
    async with session_factory() as db:
        # Fetch short and metrics
        result = await db.execute(select(YouTubeShort).where(YouTubeShort.id == uuid.UUID(short_id)))
        short = result.scalar_one_or_none()
        if not short:
            return {"error": "Short not found"}

        # Latest metrics
        result = await db.execute(
            select(ShortMetrics)
            .where(ShortMetrics.youtube_short_id == short.id)
            .order_by(ShortMetrics.collected_at.desc())
            .limit(1)
        )
        metrics_obj = result.scalar_one_or_none()
        if not metrics_obj:
            return {"error": "No metrics available"}

        metrics = {
            "views": metrics_obj.views,
            "likes": metrics_obj.likes,
            "comments": metrics_obj.comments,
            "shares": metrics_obj.shares,
            "subscribers_gained": metrics_obj.subscribers_gained,
            "average_view_duration_seconds": metrics_obj.average_view_duration_seconds,
            "average_view_percentage": metrics_obj.average_view_percentage,
            "impressions": metrics_obj.impressions,
            "impressions_ctr": metrics_obj.impressions_ctr,
            "engagement_rate": metrics_obj.engagement_rate,
        }

        # Channel averages
        result = await db.execute(
            select(
                func.avg(ShortMetrics.views),
                func.avg(ShortMetrics.likes),
                func.avg(ShortMetrics.average_view_percentage),
                func.avg(ShortMetrics.engagement_rate),
            ).join(YouTubeShort).where(YouTubeShort.user_id == uuid.UUID(user_id))
        )
        avgs = result.one()
        channel_averages = {
            "avg_views": float(avgs[0]) if avgs[0] else 0,
            "avg_likes": float(avgs[1]) if avgs[1] else 0,
            "avg_retention": float(avgs[2]) if avgs[2] else 0,
            "avg_engagement_rate": float(avgs[3]) if avgs[3] else 0,
        }

        # Script lines if associated
        script_lines = None
        if short.script_id:
            result = await db.execute(
                select(Script).where(Script.id == short.script_id)
            )
            script = result.scalar_one_or_none()
            if script and script.current_version_id:
                result = await db.execute(
                    select(ScriptVersion).where(ScriptVersion.id == script.current_version_id)
                )
                version = result.scalar_one_or_none()
                if version:
                    script_lines = version.lines

        # Existing insights
        result = await db.execute(
            select(ChannelInsight)
            .where(ChannelInsight.user_id == uuid.UUID(user_id), ChannelInsight.is_active == True)  # noqa
            .limit(20)
        )
        insights = result.scalars().all()
        existing_insights = [{"id": str(i.id), "title": i.title, "description": i.description} for i in insights]

        task.update_state(state="PROGRESS", meta={"current_step": "Analyzing with AI", "progress": 30})

        # Run agent
        agent = PerformanceAnalysisAgent()
        analysis_result = await agent.run(
            metrics=metrics,
            script_lines=script_lines,
            transcript=short.transcript,
            channel_averages=channel_averages,
            existing_insights=existing_insights,
        )

        task.update_state(state="PROGRESS", meta={"current_step": "Saving results", "progress": 80})

        # Save analysis
        scores = analysis_result.get("scores", {})
        pa = PerformanceAnalysis(
            youtube_short_id=short.id,
            script_id=short.script_id,
            hook_score=scores.get("hook"),
            rhythm_score=scores.get("rhythm"),
            curiosity_score=scores.get("curiosity"),
            retention_score=scores.get("retention"),
            clarity_score=scores.get("clarity"),
            promise_delivery_score=scores.get("promise_delivery"),
            cta_score=scores.get("cta"),
            narrative_score=scores.get("narrative"),
            overall_score=scores.get("overall"),
            strengths=analysis_result.get("strengths"),
            weaknesses=analysis_result.get("weaknesses"),
            actionable_learnings=analysis_result.get("actionable_learnings"),
            script_correlation=analysis_result.get("script_correlation"),
        )
        db.add(pa)
        await db.commit()

        return {"analysis_id": str(pa.id), "overall_score": scores.get("overall")}


@celery_app.task(name="app.tasks.analysis_tasks.analyze_channel", bind=True, max_retries=3)
def analyze_channel(self, user_id: str):
    """Analyze channel patterns and generate suggestions."""
    return _run_async(_analyze_channel(self, user_id))


async def _analyze_channel(task, user_id: str):
    session_factory = make_session_factory()
    async with session_factory() as db:
        # Fetch all shorts with metrics
        result = await db.execute(
            select(YouTubeShort)
            .where(YouTubeShort.user_id == uuid.UUID(user_id))
            .order_by(YouTubeShort.published_at.desc().nullslast())
            .limit(50)
        )
        shorts = result.scalars().all()

        if len(shorts) < 3:
            return {"error": "Need at least 3 Shorts for channel analysis"}

        shorts_data = []
        for s in shorts:
            result = await db.execute(
                select(ShortMetrics)
                .where(ShortMetrics.youtube_short_id == s.id)
                .order_by(ShortMetrics.collected_at.desc())
                .limit(1)
            )
            metrics = result.scalar_one_or_none()

            shorts_data.append({
                "id": str(s.id),
                "title": s.title,
                "description": s.description[:200] if s.description else None,
                "duration_seconds": s.duration_seconds,
                "published_at": s.published_at.isoformat() if s.published_at else None,
                "transcript": s.transcript[:500] if s.transcript else None,
                "views": metrics.views if metrics else 0,
                "likes": metrics.likes if metrics else 0,
                "comments": metrics.comments if metrics else 0,
                "retention": metrics.average_view_percentage if metrics else None,
                "engagement_rate": metrics.engagement_rate if metrics else None,
            })

        # Existing insights
        result = await db.execute(
            select(ChannelInsight)
            .where(ChannelInsight.user_id == uuid.UUID(user_id), ChannelInsight.is_active == True)  # noqa
        )
        existing_insights = [
            {"id": str(i.id), "title": i.title, "category": i.category.value}
            for i in result.scalars().all()
        ]

        task.update_state(state="PROGRESS", meta={"current_step": "AI analyzing patterns", "progress": 40})

        # Run agent
        agent = ChannelStrategyAgent()
        result_data = await agent.run(
            shorts_data=shorts_data,
            existing_insights=existing_insights,
        )

        task.update_state(state="PROGRESS", meta={"current_step": "Saving suggestions", "progress": 80})

        # Save suggestions
        suggestions_saved = 0
        for suggestion in result_data.get("suggestions", []):
            category_str = suggestion.get("category", "experiment")
            try:
                category = SuggestionCategory(category_str)
            except ValueError:
                category = SuggestionCategory.EXPERIMENT

            vs = VideoSuggestion(
                user_id=uuid.UUID(user_id),
                title=suggestion.get("title", "Untitled"),
                description=suggestion.get("description", ""),
                justification=suggestion.get("justification", ""),
                category=category,
                suggested_hook=suggestion.get("suggested_hook"),
                suggested_structure=suggestion.get("suggested_structure"),
                estimated_duration_seconds=suggestion.get("estimated_duration"),
                confidence_score=suggestion.get("confidence_score"),
                based_on_shorts=suggestion.get("based_on_shorts"),
            )
            db.add(vs)
            suggestions_saved += 1

        await db.commit()
        return {
            "patterns_found": len(result_data.get("patterns", [])),
            "opportunities_found": len(result_data.get("opportunities", [])),
            "suggestions_generated": suggestions_saved,
        }


@celery_app.task(name="app.tasks.analysis_tasks.generate_insights", bind=True, max_retries=3)
def generate_insights(self, user_id: str):
    """Generate/update insights from recent analyses."""
    return _run_async(_generate_insights(self, user_id))


async def _generate_insights(task, user_id: str):
    session_factory = make_session_factory()
    async with session_factory() as db:
        # Recent analyses
        result = await db.execute(
            select(PerformanceAnalysis)
            .join(YouTubeShort)
            .where(YouTubeShort.user_id == uuid.UUID(user_id))
            .order_by(PerformanceAnalysis.created_at.desc())
            .limit(20)
        )
        analyses = result.scalars().all()

        if len(analyses) < 2:
            return {"error": "Need at least 2 analyses to generate insights"}

        recent_analyses = [
            {
                "short_id": str(a.youtube_short_id),
                "overall_score": a.overall_score,
                "scores": {
                    "hook": a.hook_score, "rhythm": a.rhythm_score,
                    "curiosity": a.curiosity_score, "retention": a.retention_score,
                },
                "strengths": a.strengths,
                "weaknesses": a.weaknesses,
                "actionable_learnings": a.actionable_learnings,
            }
            for a in analyses
        ]

        # Existing insights
        result = await db.execute(
            select(ChannelInsight).where(ChannelInsight.user_id == uuid.UUID(user_id))
        )
        existing = [
            {
                "id": str(i.id), "title": i.title, "description": i.description,
                "category": i.category.value, "confidence": i.confidence,
                "times_validated": i.times_validated,
            }
            for i in result.scalars().all()
        ]

        task.update_state(state="PROGRESS", meta={"current_step": "AI consolidating learnings", "progress": 40})

        agent = LearningMemoryAgent()
        result_data = await agent.run(
            recent_analyses=recent_analyses,
            existing_insights=existing,
        )

        task.update_state(state="PROGRESS", meta={"current_step": "Saving insights", "progress": 80})

        # Save new insights
        new_count = 0
        for insight in result_data.get("new_insights", []):
            category_str = insight.get("category", "general")
            try:
                category = InsightCategory(category_str)
            except ValueError:
                category = InsightCategory.GENERAL

            sentiment_str = insight.get("sentiment", "neutral")
            try:
                sentiment = InsightSentiment(sentiment_str)
            except ValueError:
                sentiment = InsightSentiment.NEUTRAL

            # Generate embedding
            embedding = None
            try:
                client = get_openai_client()
                embed_response = await client.embeddings.create(
                    model="text-embedding-3-small",
                    input=f"{insight.get('title', '')} {insight.get('description', '')}",
                )
                embedding = embed_response.data[0].embedding
            except Exception:
                pass

            ci = ChannelInsight(
                user_id=uuid.UUID(user_id),
                category=category,
                sentiment=sentiment,
                title=insight.get("title", ""),
                description=insight.get("description", ""),
                evidence=insight.get("evidence"),
                niche=insight.get("niche"),
                theme=insight.get("theme"),
                confidence=insight.get("confidence", 0.5),
                times_validated=insight.get("times_validated", 1),
                embedding=embedding,
            )
            db.add(ci)
            new_count += 1

        # Update existing insights
        updated_count = 0
        for update in result_data.get("updated_insights", []):
            try:
                insight_id = uuid.UUID(update["id"])
            except (KeyError, ValueError):
                continue

            result = await db.execute(
                select(ChannelInsight).where(ChannelInsight.id == insight_id)
            )
            ci = result.scalar_one_or_none()
            if not ci:
                continue

            if update.get("action") == "validate":
                ci.confidence = update.get("new_confidence", ci.confidence)
                ci.times_validated = update.get("new_times_validated", ci.times_validated + 1)
            elif update.get("action") == "invalidate":
                ci.confidence = update.get("new_confidence", ci.confidence - 0.2)
                if ci.confidence < 0.3:
                    ci.is_active = False
            updated_count += 1

        # Deactivate insights
        deactivated_count = 0
        for deactivation in result_data.get("deactivated_insights", []):
            try:
                insight_id = uuid.UUID(deactivation["id"])
            except (KeyError, ValueError):
                continue
            result = await db.execute(
                select(ChannelInsight).where(ChannelInsight.id == insight_id)
            )
            ci = result.scalar_one_or_none()
            if ci:
                ci.is_active = False
                deactivated_count += 1

        await db.commit()
        return {
            "new_insights": new_count,
            "updated_insights": updated_count,
            "deactivated_insights": deactivated_count,
        }


@celery_app.task(name="app.tasks.analysis_tasks.generate_suggestions", bind=True, max_retries=3)
def generate_suggestions(self, user_id: str):
    """Generate new video suggestions based on channel data."""
    # Reuses channel analysis logic
    return analyze_channel(self, user_id)
