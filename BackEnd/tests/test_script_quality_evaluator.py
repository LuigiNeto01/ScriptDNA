from app.schemas.generate import ScriptAnalysis, ScriptGenerateOutput, ScriptLine
from app.schemas.script_generation_context import (
    ScriptGenerationContext,
    ScriptReference,
    ScriptReferenceSegment,
)
from app.services.script_quality_evaluator import ScriptQualityEvaluator


def test_quality_evaluator_returns_score_and_dimensions():
    script = ScriptGenerateOutput(
        lines=[
            ScriptLine(
                start="0.0",
                end="3.0",
                line="Voce sabe por que isso muda tudo?",
                function="hook",
                retention_note="abre curiosidade",
                viewer_question="por que muda tudo?",
            ),
            ScriptLine(
                start="3.0",
                end="12.0",
                line="A resposta aparece quando voce compara os dois cenarios.",
                function="setup",
                retention_note="mantem comparacao aberta",
                viewer_question="quais sao os cenarios?",
            ),
            ScriptLine(
                start="12.0",
                end="20.0",
                line="Agora salva isso para testar depois.",
                function="cta",
                retention_note="fecha com acao simples",
                viewer_question="o que fazer depois?",
            ),
        ],
        analysis=ScriptAnalysis(
            hook_strength=0.9,
            curiosity_gaps=["por que muda tudo?"],
            weak_points=[],
        ),
    )
    context = ScriptGenerationContext(
        brief={"theme": "teste", "duration": 20},
        positive_references=[
            ScriptReference(
                source_type="youtube_short",
                source_id="1",
                segments=[
                    ScriptReferenceSegment(
                        text="frase de referencia que nao deve ser copiada",
                        beat_type="hook",
                        techniques=["curiosity_gap"],
                    )
                ],
            )
        ],
        winning_patterns={"common_techniques": [("curiosity_gap", 1)]},
    )

    result = ScriptQualityEvaluator().evaluate(script, context)

    assert 0 <= result["quality_score"] <= 1
    assert {"hook", "retention", "clarity", "cta"}.issubset(result["scores"])
    assert "problems" in result
    assert "fix_suggestions" in result
