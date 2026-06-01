from difflib import SequenceMatcher


class ScriptAdherenceService:
    def compare(
        self,
        script_lines: list[dict] | None,
        transcript: str | None,
        short_segments: list | None = None,
    ) -> dict:
        planned_parts = [
            str(line.get("line", "")).strip()
            for line in (script_lines or [])
            if str(line.get("line", "")).strip()
        ]
        planned = " ".join(planned_parts)
        actual_parts = []
        if short_segments:
            actual_parts = [
                str(segment.text).strip()
                for segment in short_segments
                if getattr(segment, "text", None)
            ]
        actual = " ".join(actual_parts) if actual_parts else (transcript or "")

        if not planned or not actual:
            return {
                "script_adherence_score": None,
                "major_differences": ["roteiro ou transcricao indisponivel"],
                "missing_script_parts": [],
                "new_unscripted_parts": [],
            }

        planned_norm = _normalize(planned)
        actual_norm = _normalize(actual)
        score = SequenceMatcher(None, planned_norm, actual_norm).ratio()

        missing = [
            part for part in planned_parts
            if len(part.split()) >= 4 and _normalize(part) not in actual_norm
        ][:5]
        unscripted = [
            part for part in _chunk_words(actual, 16)
            if len(part.split()) >= 8 and _best_similarity(part, planned_parts) < 0.55
        ][:5]

        differences = []
        if score < 0.5:
            differences.append("video publicado parece distante do roteiro planejado")
        elif score < 0.75:
            differences.append("video seguiu parcialmente o roteiro")

        return {
            "script_adherence_score": round(score, 4),
            "major_differences": differences,
            "missing_script_parts": missing,
            "new_unscripted_parts": unscripted,
        }


def _normalize(text: str) -> str:
    return " ".join(text.lower().split())


def _chunk_words(text: str, size: int) -> list[str]:
    words = text.split()
    return [
        " ".join(words[index : index + size])
        for index in range(0, len(words), size)
    ]


def _best_similarity(text: str, candidates: list[str]) -> float:
    if not candidates:
        return 0
    normalized = _normalize(text)
    return max(
        SequenceMatcher(None, normalized, _normalize(candidate)).ratio()
        for candidate in candidates
    )
