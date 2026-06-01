"""Internal trend detection based on channel performance data."""
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.youtube import ShortMetrics, YouTubeShort


class TrendDetectionService:
    """Detects internal content trends from the user's own channel data."""

    async def detect_trends(
        self,
        user_id: uuid.UUID,
        db: AsyncSession,
        weeks: int = 4,
    ) -> list[dict]:
        """Analyze trends across recent weeks."""
        now = datetime.now(timezone.utc)
        weekly_data = []

        for week_offset in range(weeks):
            end = now - timedelta(weeks=week_offset)
            start = end - timedelta(weeks=1)

            result = await db.execute(
                select(
                    func.count(YouTubeShort.id),
                    func.sum(ShortMetrics.views),
                    func.sum(ShortMetrics.likes),
                    func.sum(ShortMetrics.comments),
                    func.avg(ShortMetrics.average_view_percentage),
                    func.avg(ShortMetrics.engagement_rate),
                )
                .join(ShortMetrics, ShortMetrics.youtube_short_id == YouTubeShort.id)
                .where(
                    YouTubeShort.user_id == user_id,
                    YouTubeShort.published_at >= start,
                    YouTubeShort.published_at < end,
                )
            )
            row = result.one()
            weekly_data.append({
                "week_offset": week_offset,
                "start": start.isoformat(),
                "end": end.isoformat(),
                "shorts_count": row[0] or 0,
                "total_views": int(row[1] or 0),
                "total_likes": int(row[2] or 0),
                "total_comments": int(row[3] or 0),
                "avg_retention": float(row[4]) if row[4] else None,
                "avg_engagement": float(row[5]) if row[5] else None,
            })

        trends = []

        # Detect view trend
        view_values = [w["total_views"] for w in weekly_data if w["total_views"] > 0]
        if len(view_values) >= 2:
            recent = view_values[0]
            older_avg = sum(view_values[1:]) / len(view_values[1:])
            if older_avg > 0:
                change = (recent - older_avg) / older_avg
                if abs(change) > 0.1:
                    trends.append({
                        "metric": "views",
                        "direction": "up" if change > 0 else "down",
                        "change_percent": round(change * 100, 1),
                        "recent_value": recent,
                        "baseline_avg": round(older_avg),
                    })

        # Detect engagement trend
        eng_values = [w["avg_engagement"] for w in weekly_data if w["avg_engagement"] is not None]
        if len(eng_values) >= 2:
            recent = eng_values[0]
            older_avg = sum(eng_values[1:]) / len(eng_values[1:])
            if older_avg > 0:
                change = (recent - older_avg) / older_avg
                if abs(change) > 0.1:
                    trends.append({
                        "metric": "engagement_rate",
                        "direction": "up" if change > 0 else "down",
                        "change_percent": round(change * 100, 1),
                        "recent_value": round(recent, 2),
                        "baseline_avg": round(older_avg, 2),
                    })

        # Detect retention trend
        ret_values = [w["avg_retention"] for w in weekly_data if w["avg_retention"] is not None]
        if len(ret_values) >= 2:
            recent = ret_values[0]
            older_avg = sum(ret_values[1:]) / len(ret_values[1:])
            if older_avg > 0:
                change = (recent - older_avg) / older_avg
                if abs(change) > 0.05:
                    trends.append({
                        "metric": "retention",
                        "direction": "up" if change > 0 else "down",
                        "change_percent": round(change * 100, 1),
                        "recent_value": round(recent, 1),
                        "baseline_avg": round(older_avg, 1),
                    })

        return trends

    async def weekly_summary(
        self,
        user_id: uuid.UUID,
        db: AsyncSession,
    ) -> list[dict]:
        """Get per-short data for the most recent week."""
        now = datetime.now(timezone.utc)
        week_ago = now - timedelta(weeks=1)

        result = await db.execute(
            select(YouTubeShort)
            .where(
                YouTubeShort.user_id == user_id,
                YouTubeShort.published_at >= week_ago,
            )
            .order_by(YouTubeShort.published_at.desc())
        )
        shorts = result.scalars().all()

        data = []
        for s in shorts:
            metrics_result = await db.execute(
                select(ShortMetrics)
                .where(ShortMetrics.youtube_short_id == s.id)
                .order_by(ShortMetrics.collected_at.desc())
                .limit(1)
            )
            m = metrics_result.scalar_one_or_none()
            data.append({
                "id": str(s.id),
                "title": s.title,
                "published_at": s.published_at.isoformat() if s.published_at else None,
                "views": m.views if m else 0,
                "likes": m.likes if m else 0,
                "comments": m.comments if m else 0,
                "engagement_rate": m.engagement_rate if m else None,
                "average_view_percentage": m.average_view_percentage if m else None,
            })

        return data
