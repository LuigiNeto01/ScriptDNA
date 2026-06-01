from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.youtube import ShortRetentionWindow, YouTubeShort


@dataclass
class RetentionWindow:
    start_time: float
    end_time: float
    retention_percentage: float | None = None
    relative_retention: float | None = None
    drop_rate: float | None = None
    source: str = "unknown"

    def to_dict(self) -> dict:
        return {
            "start_time": self.start_time,
            "end_time": self.end_time,
            "retention_percentage": self.retention_percentage,
            "relative_retention": self.relative_retention,
            "drop_rate": self.drop_rate,
            "source": self.source,
        }


class RetentionWindowProvider:
    async def get_windows(
        self,
        short: YouTubeShort,
        db: AsyncSession,
    ) -> list[RetentionWindow]:
        rows = (
            await db.execute(
                select(ShortRetentionWindow)
                .where(ShortRetentionWindow.short_id == short.id)
                .order_by(ShortRetentionWindow.start_time)
            )
        ).scalars().all()
        if rows:
            return [
                RetentionWindow(
                    start_time=row.start_time,
                    end_time=row.end_time,
                    retention_percentage=row.retention_percentage,
                    relative_retention=row.relative_retention,
                    drop_rate=row.drop_rate,
                    source=row.source,
                )
                for row in rows
            ]

        return self.empty_template(short.duration_seconds or 60)

    def empty_template(self, duration_seconds: int) -> list[RetentionWindow]:
        duration = max(float(duration_seconds), 1.0)
        ranges = [
            (0, min(3, duration)),
            (min(3, duration), min(10, duration)),
            (duration * 0.10, duration * 0.30),
            (duration * 0.30, duration * 0.60),
            (duration * 0.60, duration * 0.90),
            (duration * 0.90, duration),
        ]
        windows = []
        seen = set()
        for start, end in ranges:
            start = round(max(0.0, min(start, duration)), 2)
            end = round(max(start, min(end, duration)), 2)
            key = (start, end)
            if end <= start or key in seen:
                continue
            seen.add(key)
            windows.append(RetentionWindow(start_time=start, end_time=end, source="template"))
        return windows
