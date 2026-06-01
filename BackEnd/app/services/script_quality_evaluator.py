from app.schemas.generate import ScriptGenerateOutput
from app.schemas.script_generation_context import ScriptGenerationContext


class ScriptQualityEvaluator:
    def evaluate(
        self,
        script: ScriptGenerateOutput,
        context: ScriptGenerationContext | None = None,
    ) -> dict:
        lines = script.lines
        first_line = lines[0].line if lines else ""
        all_text = " ".join(line.line for line in lines)

        hook = _clamp(script.analysis.hook_strength or _hook_score(first_line))
        clarity = _clarity_score(lines)
        retention = _retention_score(script, context)
        cta = _cta_score(lines)
        style = _style_score(lines, context)
        copy_risk = _copy_risk(all_text, context)
        long_sentence_risk = _long_sentence_risk(lines)
        early_payoff_risk = _early_payoff_risk(lines)

        risk_penalty = (copy_risk + long_sentence_risk + early_payoff_risk) / 9
        quality_score = _clamp(
            hook * 0.25
            + retention * 0.25
            + clarity * 0.20
            + cta * 0.10
            + style * 0.10
            + (1 - risk_penalty) * 0.10
        )

        problems = []
        suggestions = []
        if hook < 0.7:
            problems.append("hook fraco")
            suggestions.append("Abra uma curiosidade mais concreta nos primeiros 3 segundos.")
        if cta < 0.5:
            problems.append("CTA ausente ou fraco")
            suggestions.append("Feche com uma chamada clara e alinhada ao objetivo.")
        if copy_risk > 0.5:
            problems.append("risco de copiar frases de referencia")
            suggestions.append("Reescreva trechos parecidos com referencias usando outra formulacao.")
        if long_sentence_risk > 0.5:
            problems.append("frases longas demais")
            suggestions.append("Quebre falas longas em linhas curtas e escaneaveis.")
        if early_payoff_risk > 0.5:
            problems.append("payoff revelado cedo demais")
            suggestions.append("Atrase a resolucao principal ate o terco final.")

        return {
            "quality_score": round(quality_score, 4),
            "scores": {
                "hook": round(hook, 4),
                "retention": round(retention, 4),
                "clarity": round(clarity, 4),
                "cta": round(cta, 4),
                "style": round(style, 4),
            },
            "risks": {
                "copy_reference": round(copy_risk, 4),
                "long_sentences": round(long_sentence_risk, 4),
                "early_payoff": round(early_payoff_risk, 4),
            },
            "problems": problems,
            "fix_suggestions": suggestions,
        }


def _hook_score(text: str) -> float:
    if not text:
        return 0
    markers = ["?", "por que", "segredo", "erro", "ninguem", "descobri", "pare"]
    lowered = text.lower()
    return 0.85 if any(marker in lowered for marker in markers) else 0.65


def _clarity_score(lines: list) -> float:
    if not lines:
        return 0
    avg_words = sum(len(line.line.split()) for line in lines) / len(lines)
    if avg_words <= 12:
        return 0.9
    if avg_words <= 18:
        return 0.75
    return 0.55


def _retention_score(
    script: ScriptGenerateOutput, context: ScriptGenerationContext | None
) -> float:
    notes = [line.retention_note for line in script.lines if line.retention_note]
    questions = [line.viewer_question for line in script.lines if line.viewer_question]
    base = 0.55 + min(len(notes), len(script.lines)) * 0.04
    if questions:
        base += 0.1
    if context and context.winning_patterns.get("common_techniques"):
        base += 0.05
    return _clamp(base)


def _cta_score(lines: list) -> float:
    if not lines:
        return 0
    cta_lines = [line for line in lines if line.function == "cta"]
    if cta_lines:
        return 0.85
    tail = " ".join(line.line.lower() for line in lines[-2:])
    return 0.65 if any(word in tail for word in ["comenta", "segue", "salva", "clica"]) else 0.35


def _style_score(
    lines: list, context: ScriptGenerationContext | None
) -> float:
    if not context or not context.style_profile:
        return 0.7
    target = context.style_profile.get("avg_sentence_length")
    if not target or not lines:
        return 0.75
    avg_words = sum(len(line.line.split()) for line in lines) / len(lines)
    return _clamp(1 - abs(avg_words - float(target)) / max(float(target), 1))


def _copy_risk(text: str, context: ScriptGenerationContext | None) -> float:
    if not context or not text:
        return 0
    lowered = text.lower()
    matches = 0
    checked = 0
    references = context.positive_references + context.negative_references
    for reference in references:
        for segment in reference.segments:
            words = segment.text.lower().split()
            if len(words) < 6:
                continue
            checked += 1
            phrase = " ".join(words[:8])
            if phrase and phrase in lowered:
                matches += 1
    return matches / checked if checked else 0


def _long_sentence_risk(lines: list) -> float:
    if not lines:
        return 0
    long_lines = [line for line in lines if len(line.line.split()) > 22]
    return len(long_lines) / len(lines)


def _early_payoff_risk(lines: list) -> float:
    if not lines:
        return 0
    payoff_positions = [
        idx for idx, line in enumerate(lines) if line.function == "payoff"
    ]
    if not payoff_positions:
        return 0.2
    return 0.8 if payoff_positions[0] < len(lines) / 2 else 0.1


def _clamp(value: float) -> float:
    return max(0.0, min(float(value), 1.0))
