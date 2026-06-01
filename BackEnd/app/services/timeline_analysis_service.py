from app.models.youtube import YouTubeShortBeat, YouTubeShortSegment
from app.services.retention_window_provider import RetentionWindow


class TimelineAnalysisService:
    def analyze(
        self,
        script_lines: list[dict] | None,
        segments: list[YouTubeShortSegment],
        beats: list[YouTubeShortBeat],
        retention_windows: list[RetentionWindow],
    ) -> dict:
        beats_by_segment = {beat.segment_id: beat for beat in beats if beat.segment_id}
        aligned = [
            self._align_segment(segment, beats_by_segment.get(segment.id), script_lines or [], retention_windows)
            for segment in segments
        ]
        strong_moments = [
            item for item in aligned
            if _window_value(item.get("window"), "relative_retention") is not None
            and _window_value(item.get("window"), "relative_retention") >= 1.05
        ]
        drop_moments = [
            item for item in aligned
            if _window_value(item.get("window"), "drop_rate") is not None
            and _window_value(item.get("window"), "drop_rate") >= 0.15
        ]
        beat_scores = self._beat_scores(aligned)
        timeline_score = _avg([score for score in beat_scores.values() if score is not None])

        return {
            "timeline_score": round(timeline_score, 4) if timeline_score is not None else None,
            "strong_moments": [
                _moment(item, "retencao acima da janela/media") for item in strong_moments[:5]
            ],
            "drop_moments": [
                {
                    **_moment(item, "queda de retencao detectada"),
                    "drop_rate": _window_value(item.get("window"), "drop_rate"),
                    "possible_reason": _drop_reason(item),
                }
                for item in drop_moments[:5]
            ],
            "beat_performance": {
                beat: {"score": score}
                for beat, score in beat_scores.items()
            },
            "beat_scores": beat_scores,
            "aligned_segments": aligned,
            "retention_windows": [window.to_dict() for window in retention_windows],
        }

    def _align_segment(
        self,
        segment: YouTubeShortSegment,
        beat: YouTubeShortBeat | None,
        script_lines: list[dict],
        retention_windows: list[RetentionWindow],
    ) -> dict:
        related_line = _closest_script_line(segment, script_lines)
        window = _window_for_segment(segment, retention_windows)
        return {
            "start_time": segment.start_time,
            "end_time": segment.end_time,
            "text": segment.text,
            "beat_type": beat.beat_type if beat else None,
            "retention_function": beat.retention_function if beat else None,
            "related_script_line": related_line,
            "window": window.to_dict() if window else None,
        }

    def _beat_scores(self, aligned: list[dict]) -> dict:
        result = {}
        for beat in ["hook", "setup", "conflict", "escalation", "payoff", "cta"]:
            items = [item for item in aligned if item.get("beat_type") == beat]
            if not items:
                result[beat] = None
                continue
            scores = []
            for item in items:
                window = item.get("window") or {}
                if window.get("relative_retention") is not None:
                    scores.append(min(max(window["relative_retention"] / 1.2, 0), 1))
                elif window.get("retention_percentage") is not None:
                    scores.append(min(max(window["retention_percentage"] / 100, 0), 1))
            result[beat] = round(_avg(scores), 4) if scores else None
        return result


def _closest_script_line(segment: YouTubeShortSegment, script_lines: list[dict]) -> str | None:
    if not script_lines:
        return None
    midpoint = (segment.start_time + segment.end_time) / 2
    best = None
    best_distance = None
    for line in script_lines:
        try:
            start = float(line.get("start", 0))
            end = float(line.get("end", start))
        except (TypeError, ValueError):
            continue
        line_midpoint = (start + end) / 2
        distance = abs(midpoint - line_midpoint)
        if best_distance is None or distance < best_distance:
            best_distance = distance
            best = line.get("line")
    return best


def _window_for_segment(
    segment: YouTubeShortSegment, windows: list[RetentionWindow]
) -> RetentionWindow | None:
    midpoint = (segment.start_time + segment.end_time) / 2
    for window in windows:
        if window.start_time <= midpoint <= window.end_time:
            return window
    return None


def _window_value(window: dict | None, key: str):
    return (window or {}).get(key)


def _moment(item: dict, reason: str) -> dict:
    return {
        "start_time": item["start_time"],
        "end_time": item["end_time"],
        "reason": reason,
        "related_script_line": item.get("related_script_line"),
        "beat_type": item.get("beat_type"),
    }


def _drop_reason(item: dict) -> str:
    beat = item.get("beat_type")
    if beat == "setup":
        return "setup pode estar longo antes do conflito"
    if beat == "hook":
        return "queda logo apos hook"
    if beat == "cta":
        return "final ou CTA pouco convincente"
    return "trecho perdeu retencao relativa"


def _avg(values: list[float]) -> float | None:
    clean = [value for value in values if value is not None]
    return sum(clean) / len(clean) if clean else None
