import asyncio
import logging
import uuid

from sqlalchemy import func, select

from app.agents.channel_strategy_agent import ChannelStrategyAgent
from app.agents.comment_analysis_agent import CommentAnalysisAgent
from app.agents.learning_memory_agent import LearningMemoryAgent
from app.agents.performance_analysis_agent import PerformanceAnalysisAgent
from app.agents.weekly_strategy_agent import WeeklyStrategyAgent
from app.core.celery_app import celery_app
from app.core.openai_client import get_openai_client
from app.db.session import make_session_factory

logger = logging.getLogger(__name__)
from app.models.insight import ChannelInsight, InsightCategory, InsightSentiment
from app.models.performance_analysis import PerformanceAnalysis
from app.models.script import Script, ScriptVersion
from app.models.suggestion import SuggestionCategory, VideoSuggestion
from app.models.user import User
from app.models.youtube import ShortMetrics, YouTubeShort
from app.models.youtube import YouTubeShortBeat, YouTubeShortSegment
from app.models.youtube_short_comment import YouTubeShortComment
from app.services.learning_loop_service import LearningLoopService
from app.services.retention_window_provider import RetentionWindowProvider
from app.services.script_adherence_service import ScriptAdherenceService
from app.services.timeline_analysis_service import TimelineAnalysisService


def _run_async(coro):
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


def _backoff_delay(retries: int, base: int = 15) -> int:
    return base * (3 ** retries)


@celery_app.task(name="app.tasks.analysis_tasks.analyze_short_performance", bind=True, max_retries=3)
def analyze_short_performance(self, user_id: str, short_id: str):
    """Analyze performance of a specific Short using AI."""
    logger.info("analyze_short_performance started", extra={"task_id": self.request.id, "short_id": short_id, "step": "start"})
    try:
        return _run_async(_analyze_short_performance(self, user_id, short_id))
    except Exception as exc:
        logger.error("analyze_short_performance failed", extra={"task_id": self.request.id, "error": str(exc)})
        raise self.retry(exc=exc, countdown=_backoff_delay(self.request.retries))


async def _analyze_short_performance(task, user_id: str, short_id: str):
    session_factory = make_session_factory()
    async with session_factory() as db:
        # Fetch short and metrics
        result = await db.execute(
            select(YouTubeShort).where(
                YouTubeShort.id == uuid.UUID(short_id),
                YouTubeShort.user_id == uuid.UUID(user_id),
            )
        )
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
        version = None
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

        segment_result = await db.execute(
            select(YouTubeShortSegment)
            .where(YouTubeShortSegment.short_id == short.id)
            .order_by(YouTubeShortSegment.start_time)
        )
        short_segments = segment_result.scalars().all()
        beat_result = await db.execute(
            select(YouTubeShortBeat).where(YouTubeShortBeat.short_id == short.id)
        )
        short_beats = beat_result.scalars().all()
        retention_windows = await RetentionWindowProvider().get_windows(short, db)
        timeline_analysis = TimelineAnalysisService().analyze(
            script_lines=script_lines,
            segments=short_segments,
            beats=short_beats,
            retention_windows=retention_windows,
        )
        script_adherence = ScriptAdherenceService().compare(
            script_lines=script_lines,
            transcript=short.transcript,
            short_segments=short_segments,
        )

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
            script_adherence=script_adherence,
            timeline_analysis=timeline_analysis,
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
            script_adherence=analysis_result.get("script_adherence") or script_adherence,
            timeline_analysis=analysis_result.get("timeline_analysis") or timeline_analysis,
            beat_scores=analysis_result.get("beat_scores") or timeline_analysis.get("beat_scores"),
        )
        db.add(pa)
        await db.flush()

        learning_result = await LearningLoopService().maybe_update_after_analysis(
            uuid.UUID(user_id), short, pa, db
        )
        await db.commit()

        return {
            "analysis_id": str(pa.id),
            "overall_score": scores.get("overall"),
            "learning": learning_result,
        }


@celery_app.task(name="app.tasks.analysis_tasks.analyze_channel", bind=True, max_retries=3)
def analyze_channel(self, user_id: str):
    """Analyze channel patterns and generate suggestions."""
    logger.info("analyze_channel started", extra={"task_id": self.request.id, "user_id": user_id, "step": "start"})
    try:
        return _run_async(_analyze_channel(self, user_id))
    except Exception as exc:
        logger.error("analyze_channel failed", extra={"task_id": self.request.id, "error": str(exc)})
        raise self.retry(exc=exc, countdown=_backoff_delay(self.request.retries))


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
    logger.info("generate_insights started", extra={"task_id": self.request.id, "user_id": user_id, "step": "start"})
    try:
        return _run_async(_generate_insights(self, user_id))
    except Exception as exc:
        logger.error("generate_insights failed", extra={"task_id": self.request.id, "error": str(exc)})
        raise self.retry(exc=exc, countdown=_backoff_delay(self.request.retries))


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

        counts = await LearningLoopService().persist_agent_result(
            uuid.UUID(user_id), result_data, db
        )
        decayed_count = await LearningLoopService().apply_temporal_decay(
            uuid.UUID(user_id), db
        )
        await db.commit()
        return {
            **counts,
            "decayed_insights": decayed_count,
        }


@celery_app.task(name="app.tasks.analysis_tasks.generate_suggestions", bind=True, max_retries=3)
def generate_suggestions(self, user_id: str):
    """Generate new video suggestions based on channel data."""
    # Reuses channel analysis logic
    return analyze_channel(self, user_id)


@celery_app.task(name="app.tasks.analysis_tasks.analyze_short_comments", bind=True, max_retries=3)
def analyze_short_comments(self, user_id: str, short_id: str):
    """Analyze comments of a Short using CommentAnalysisAgent."""
    logger.info("analyze_short_comments started", extra={"task_id": self.request.id, "short_id": short_id, "step": "start"})
    try:
        return _run_async(_analyze_short_comments(self, user_id, short_id))
    except Exception as exc:
        logger.error("analyze_short_comments failed", extra={"task_id": self.request.id, "error": str(exc)})
        raise self.retry(exc=exc, countdown=_backoff_delay(self.request.retries))


async def _analyze_short_comments(task, user_id: str, short_id: str):
    from datetime import datetime, timezone

    session_factory = make_session_factory()
    async with session_factory() as db:
        # Fetch short
        result = await db.execute(
            select(YouTubeShort).where(
                YouTubeShort.id == uuid.UUID(short_id),
                YouTubeShort.user_id == uuid.UUID(user_id),
            )
        )
        short = result.scalar_one_or_none()
        if not short:
            return {"error": "Short not found"}

        # Fetch unanalyzed comments
        result = await db.execute(
            select(YouTubeShortComment)
            .where(
                YouTubeShortComment.short_id == short.id,
                YouTubeShortComment.analyzed_at.is_(None),
            )
            .order_by(YouTubeShortComment.published_at.asc().nullslast())
            .limit(200)
        )
        comments = result.scalars().all()

        if not comments:
            return {"analyzed": 0, "message": "No unanalyzed comments"}

        # Prepare comments for agent
        comments_data = [
            {
                "youtube_comment_id": c.youtube_comment_id,
                "author_name": c.author_name,
                "text": c.text,
                "like_count": c.like_count,
            }
            for c in comments
        ]

        task.update_state(state="PROGRESS", meta={"current_step": "AI analyzing comments", "progress": 30})

        # Determine niche from user's style profile or channel insights
        niche = None
        result = await db.execute(
            select(ChannelInsight.niche)
            .where(ChannelInsight.user_id == uuid.UUID(user_id))
            .limit(1)
        )
        niche_row = result.first()
        if niche_row and niche_row[0]:
            niche = niche_row[0]

        agent = CommentAnalysisAgent()
        analysis = await agent.run(
            comments=comments_data,
            video_title=short.title,
            video_niche=niche,
        )

        task.update_state(state="PROGRESS", meta={"current_step": "Saving analysis", "progress": 70})

        # Update each comment with analysis results
        analyzed_comments = {c["youtube_comment_id"]: c for c in analysis.get("comments", [])}
        now = datetime.now(timezone.utc)

        for comment in comments:
            result_data = analyzed_comments.get(comment.youtube_comment_id)
            if result_data:
                comment.sentiment = result_data.get("sentiment")
                comment.sentiment_score = result_data.get("sentiment_score")
                comment.intent = result_data.get("intent")
                comment.topics = result_data.get("topics")
                comment.actionable_insight = result_data.get("actionable_insight")
            comment.analyzed_at = now

        await db.flush()

        # Feed into learning loop if enough comments
        task.update_state(state="PROGRESS", meta={"current_step": "Updating learning loop", "progress": 85})
        summary = analysis.get("summary", {})
        learning_result = await LearningLoopService().maybe_learn_from_comments(
            uuid.UUID(user_id), short, summary, db,
        )

        await db.commit()

        return {
            "analyzed": len(comments),
            "summary": summary,
            "learning": learning_result,
        }


@celery_app.task(name="app.tasks.analysis_tasks.generate_weekly_strategy", bind=True, max_retries=3)
def generate_weekly_strategy(self, user_id: str):
    """Generate weekly strategy report with trends."""
    logger.info("generate_weekly_strategy started", extra={"task_id": self.request.id, "user_id": user_id, "step": "start"})
    try:
        return _run_async(_generate_weekly_strategy(self, user_id))
    except Exception as exc:
        logger.error("generate_weekly_strategy failed", extra={"task_id": self.request.id, "error": str(exc)})
        raise self.retry(exc=exc, countdown=_backoff_delay(self.request.retries))


async def _generate_weekly_strategy(task, user_id: str):
    from app.services.trend_detection_service import TrendDetectionService

    session_factory = make_session_factory()
    async with session_factory() as db:
        trend_service = TrendDetectionService()

        task.update_state(state="PROGRESS", meta={"current_step": "Collecting weekly data", "progress": 10})

        # Current week shorts
        weekly_shorts = await trend_service.weekly_summary(uuid.UUID(user_id), db)
        if not weekly_shorts:
            return {"error": "No Shorts published this week"}

        # Detect internal trends
        trends = await trend_service.detect_trends(uuid.UUID(user_id), db, weeks=4)

        # Existing insights
        result = await db.execute(
            select(ChannelInsight)
            .where(ChannelInsight.user_id == uuid.UUID(user_id), ChannelInsight.is_active == True)  # noqa
            .limit(20)
        )
        insights = [
            {"id": str(i.id), "title": i.title, "category": i.category.value}
            for i in result.scalars().all()
        ]

        # Recent comment summary (aggregate from analyzed comments)
        from sqlalchemy import func as sqla_func
        from app.models.youtube_short_comment import YouTubeShortComment
        from datetime import datetime, timedelta, timezone

        week_ago = datetime.now(timezone.utc) - timedelta(weeks=1)
        comment_result = await db.execute(
            select(
                sqla_func.count(YouTubeShortComment.id),
                sqla_func.avg(YouTubeShortComment.sentiment_score),
            )
            .where(
                YouTubeShortComment.user_id == uuid.UUID(user_id),
                YouTubeShortComment.analyzed_at.isnot(None),
                YouTubeShortComment.created_at >= week_ago,
            )
        )
        comment_row = comment_result.one()
        comment_summary = None
        if comment_row[0] and comment_row[0] > 0:
            comment_summary = {
                "total_comments_this_week": comment_row[0],
                "avg_sentiment_score": round(float(comment_row[1]), 2) if comment_row[1] else None,
            }

        # Previous weeks summary for trend context
        previous_weeks = [
            {"week_offset": t.get("week_offset", 0), **t}
            for t in trends
        ] if trends else None

        task.update_state(state="PROGRESS", meta={"current_step": "AI generating strategy", "progress": 40})

        agent = WeeklyStrategyAgent()
        report = await agent.run(
            weekly_shorts=weekly_shorts,
            previous_weeks=previous_weeks,
            existing_insights=insights,
            comment_summary=comment_summary,
        )

        task.update_state(state="PROGRESS", meta={"current_step": "Complete", "progress": 100})

        return {
            "report": report,
            "internal_trends": trends,
            "shorts_analyzed": len(weekly_shorts),
        }
