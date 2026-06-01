"""Tests for Phase 8B — comments, experiments, titles, thumbnails, trends, weekly strategy."""

import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.models.youtube_short_comment import YouTubeShortComment
from app.models.script_experiment import ScriptExperiment


# ============================================================
# YouTubeShortComment model tests
# ============================================================


class TestYouTubeShortCommentModel:
    def test_model_creation(self):
        comment = YouTubeShortComment(
            user_id=uuid.uuid4(),
            short_id=uuid.uuid4(),
            youtube_comment_id="abc123",
            text="Great video!",
            like_count=5,
        )
        assert comment.youtube_comment_id == "abc123"
        assert comment.text == "Great video!"
        assert comment.like_count == 5
        assert comment.sentiment is None
        assert comment.analyzed_at is None

    def test_analysis_fields(self):
        comment = YouTubeShortComment(
            user_id=uuid.uuid4(),
            short_id=uuid.uuid4(),
            youtube_comment_id="def456",
            text="Could improve audio",
            sentiment="negative",
            sentiment_score=-0.6,
            intent="complaint",
            topics=["audio", "quality"],
            actionable_insight="Improve audio quality",
        )
        assert comment.sentiment == "negative"
        assert comment.sentiment_score == -0.6
        assert comment.intent == "complaint"
        assert comment.topics == ["audio", "quality"]


# ============================================================
# ScriptExperiment model tests
# ============================================================


class TestScriptExperimentModel:
    def test_model_creation(self):
        exp = ScriptExperiment(
            user_id=uuid.uuid4(),
            name="Hook comparison test",
            hypothesis="Question hooks perform better than statement hooks",
        )
        assert exp.name == "Hook comparison test"
        assert exp.status == "draft"
        assert exp.winner is None

    def test_experiment_completion(self):
        exp = ScriptExperiment(
            user_id=uuid.uuid4(),
            name="CTA test",
            status="completed",
            winner="a",
            result_summary="Variant A had 20% better engagement",
        )
        assert exp.status == "completed"
        assert exp.winner == "a"


# ============================================================
# CommentAnalysisAgent tests
# ============================================================


class TestCommentAnalysisAgent:
    @pytest.mark.asyncio
    async def test_agent_analyzes_comments(self):
        from app.agents.comment_analysis_agent import CommentAnalysisAgent

        mock_response = MagicMock()
        mock_response.choices = [
            MagicMock(
                message=MagicMock(
                    content='{"comments": [{"youtube_comment_id": "c1", "sentiment": "positive", "sentiment_score": 0.8, "intent": "praise", "topics": ["humor"], "actionable_insight": null}], "summary": {"total_analyzed": 1, "sentiment_distribution": {"positive": 1}, "avg_sentiment_score": 0.8, "top_intents": ["praise"], "top_topics": ["humor"], "spam_count": 0, "key_insights": [], "audience_requests": [], "content_strengths": ["humor"], "content_weaknesses": []}}'
                )
            )
        ]

        with patch("app.agents.comment_analysis_agent.get_openai_client") as mock_client:
            mock_client.return_value.chat.completions.create = AsyncMock(return_value=mock_response)

            agent = CommentAnalysisAgent()
            result = await agent.run(
                comments=[{"youtube_comment_id": "c1", "author_name": "User", "text": "LOL so funny", "like_count": 3}],
                video_title="Funny video",
            )

        assert len(result["comments"]) == 1
        assert result["comments"][0]["sentiment"] == "positive"
        assert result["summary"]["total_analyzed"] == 1

    @pytest.mark.asyncio
    async def test_agent_returns_summary(self):
        from app.agents.comment_analysis_agent import CommentAnalysisAgent

        mock_response = MagicMock()
        mock_response.choices = [
            MagicMock(
                message=MagicMock(
                    content='{"comments": [], "summary": {"total_analyzed": 0, "sentiment_distribution": {}, "avg_sentiment_score": 0, "top_intents": [], "top_topics": [], "spam_count": 0, "key_insights": [], "audience_requests": [], "content_strengths": [], "content_weaknesses": []}}'
                )
            )
        ]

        with patch("app.agents.comment_analysis_agent.get_openai_client") as mock_client:
            mock_client.return_value.chat.completions.create = AsyncMock(return_value=mock_response)

            agent = CommentAnalysisAgent()
            result = await agent.run(comments=[], video_title="Test")

        assert "summary" in result
        assert result["summary"]["total_analyzed"] == 0


# ============================================================
# WeeklyStrategyAgent tests
# ============================================================


class TestWeeklyStrategyAgent:
    @pytest.mark.asyncio
    async def test_agent_generates_report(self):
        from app.agents.weekly_strategy_agent import WeeklyStrategyAgent

        mock_response = MagicMock()
        mock_response.choices = [
            MagicMock(
                message=MagicMock(
                    content='{"period": {"start": "2026-05-25", "end": "2026-06-01"}, "summary": {"total_views": 1000, "total_likes": 50, "total_comments": 10, "shorts_published": 3, "trend": "growing", "trend_detail": "Views up 15%"}, "best_short": null, "worst_short": null, "highlights": [], "concerns": [], "internal_trends": [], "action_plan": [{"action": "Post more consistently", "priority": "high", "reasoning": "Gap detected", "expected_impact": "10% more views"}], "content_ideas": []}'
                )
            )
        ]

        with patch("app.agents.weekly_strategy_agent.get_openai_client") as mock_client:
            mock_client.return_value.chat.completions.create = AsyncMock(return_value=mock_response)

            agent = WeeklyStrategyAgent()
            result = await agent.run(
                weekly_shorts=[{"id": "1", "title": "Test", "views": 500}],
            )

        assert result["summary"]["trend"] == "growing"
        assert len(result["action_plan"]) == 1


# ============================================================
# TrendDetectionService tests
# ============================================================


class TestTrendDetectionService:
    def test_service_instantiation(self):
        from app.services.trend_detection_service import TrendDetectionService

        service = TrendDetectionService()
        assert service is not None


# ============================================================
# LearningLoopService comment integration tests
# ============================================================


class TestLearningLoopComments:
    @pytest.mark.asyncio
    async def test_skips_when_too_few_comments(self):
        from app.services.learning_loop_service import LearningLoopService
        from app.models.youtube import YouTubeShort

        service = LearningLoopService()
        mock_short = MagicMock(spec=YouTubeShort)
        mock_short.id = uuid.uuid4()
        mock_db = AsyncMock()

        result = await service.maybe_learn_from_comments(
            uuid.uuid4(),
            mock_short,
            {"total_analyzed": 3, "content_strengths": [], "content_weaknesses": [], "audience_requests": []},
            mock_db,
        )
        assert result["status"] == "skipped"
        assert result["reason"] == "not_enough_comments"

    @pytest.mark.asyncio
    async def test_creates_insights_from_strengths(self):
        from app.services.learning_loop_service import LearningLoopService
        from app.models.youtube import YouTubeShort

        service = LearningLoopService()
        mock_short = MagicMock(spec=YouTubeShort)
        mock_short.id = uuid.uuid4()

        mock_db = AsyncMock()
        # Mock _similar_insight_exists to always return False
        mock_db.execute = AsyncMock(return_value=MagicMock(scalars=MagicMock(return_value=MagicMock(all=MagicMock(return_value=[])))))
        mock_db.get = AsyncMock(return_value=None)

        with patch.object(service, "_similar_insight_exists", AsyncMock(return_value=False)):
            with patch("app.services.learning_loop_service._embedding_for_insight", AsyncMock(return_value=None)):
                result = await service.maybe_learn_from_comments(
                    uuid.uuid4(),
                    mock_short,
                    {
                        "total_analyzed": 10,
                        "content_strengths": ["humor", "editing"],
                        "content_weaknesses": ["audio"],
                        "audience_requests": ["more tutorials"],
                    },
                    mock_db,
                )

        assert result["status"] == "completed"
        assert result["new_insights"] == 4  # 2 strengths + 1 weakness + 1 request


# ============================================================
# Generate schemas tests
# ============================================================


class TestGenerateSchemas:
    def test_titles_input_validation(self):
        from app.schemas.generate import TitlesInput

        data = TitlesInput(theme="Minecraft update", count=5)
        assert data.theme == "Minecraft update"
        assert data.count == 5

    def test_thumbnail_input_validation(self):
        from app.schemas.generate import ThumbnailInput

        data = ThumbnailInput(theme="Gaming tips", title="Top 5 tips", count=3)
        assert data.theme == "Gaming tips"
        assert data.count == 3

    def test_title_suggestion_model(self):
        from app.schemas.generate import TitleSuggestion

        title = TitleSuggestion(
            title="You won't believe this!",
            strategy="curiosity_gap",
            predicted_ctr="alto",
        )
        assert title.strategy == "curiosity_gap"

    def test_thumbnail_idea_model(self):
        from app.schemas.generate import ThumbnailIdea

        idea = ThumbnailIdea(
            concept="Close-up of surprised face",
            text_overlay="NO WAY!",
            emotion="surprise",
            color_palette=["red", "yellow"],
            composition="Center subject, blurred background",
        )
        assert idea.emotion == "surprise"
        assert len(idea.color_palette) == 2


# ============================================================
# Migration compilation test
# ============================================================


class TestMigration:
    def test_migration_compiles(self):
        import importlib

        spec = importlib.util.spec_from_file_location(
            "migration_phase8b",
            "BackEnd/alembic/versions/f6a7b8c9d0e1_phase8b_comments.py",
        )
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        assert hasattr(module, "upgrade")
        assert hasattr(module, "downgrade")
