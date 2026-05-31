"""
Golden Set — Testes de regressão do AnalysisAgent

Usa um conjunto fixo de inputs de referência com output esperado anotado.
Rode sempre que o AnalysisAgent for modificado.

Regressão = output saiu do intervalo esperado em mais de 20% dos casos.
"""
import json
from pathlib import Path

import pytest

from app.agents.analysis_agent import AnalysisAgent

GOLDEN_DIR = Path(__file__).parent / "cases"


def load_golden_cases() -> list[dict]:
    """Carrega todos os golden cases do diretório."""
    cases = []
    for f in sorted(GOLDEN_DIR.glob("*.json")):
        with open(f) as fp:
            case = json.load(fp)
            case["_file"] = f.name
            cases.append(case)
    return cases


GOLDEN_CASES = load_golden_cases()


def _validate_case(result: dict, expected: dict, case_name: str) -> list[str]:
    """Valida o resultado contra as expectativas. Retorna lista de falhas."""
    failures = []
    beats = result.get("beats", [])

    # Validar número de beats
    if "total_beats_min" in expected:
        if len(beats) < expected["total_beats_min"]:
            failures.append(
                f"[{case_name}] Esperava >= {expected['total_beats_min']} beats, "
                f"obteve {len(beats)}"
            )
    if "total_beats_max" in expected:
        if len(beats) > expected["total_beats_max"]:
            failures.append(
                f"[{case_name}] Esperava <= {expected['total_beats_max']} beats, "
                f"obteve {len(beats)}"
            )

    # Validar primeiro beat
    if "first_beat" in expected and beats:
        fb = beats[0]
        fb_exp = expected["first_beat"]

        if "beat_type" in fb_exp:
            if fb.get("beat_type") != fb_exp["beat_type"]:
                failures.append(
                    f"[{case_name}] Primeiro beat: esperava beat_type='{fb_exp['beat_type']}', "
                    f"obteve '{fb.get('beat_type')}'"
                )

        if "beat_type_one_of" in fb_exp:
            if fb.get("beat_type") not in fb_exp["beat_type_one_of"]:
                failures.append(
                    f"[{case_name}] Primeiro beat: beat_type '{fb.get('beat_type')}' "
                    f"não está em {fb_exp['beat_type_one_of']}"
                )

        if "intensity_score_min" in fb_exp:
            score = fb.get("intensity_score", 0)
            if score < fb_exp["intensity_score_min"]:
                failures.append(
                    f"[{case_name}] Primeiro beat: intensity_score {score} "
                    f"< mínimo {fb_exp['intensity_score_min']}"
                )

        if "techniques_must_include" in fb_exp:
            tech_names = [t.get("name", "") for t in fb.get("techniques", [])]
            for required_tech in fb_exp["techniques_must_include"]:
                if required_tech not in tech_names:
                    failures.append(
                        f"[{case_name}] Primeiro beat: técnica '{required_tech}' "
                        f"não encontrada em {tech_names}"
                    )

        if fb_exp.get("has_attention_goal"):
            if not fb.get("attention_goal"):
                failures.append(
                    f"[{case_name}] Primeiro beat: attention_goal ausente"
                )

    # Validar presença de beat types específicos
    beat_types = [b.get("beat_type") for b in beats]

    if expected.get("has_setup_beat") and "setup" not in beat_types:
        failures.append(f"[{case_name}] Esperava beat 'setup', não encontrado")

    if expected.get("has_cta_beat") and "cta" not in beat_types:
        failures.append(f"[{case_name}] Esperava beat 'cta', não encontrado")

    if expected.get("has_payoff_beat") and "payoff" not in beat_types:
        failures.append(f"[{case_name}] Esperava beat 'payoff', não encontrado")

    return failures


# ============================================================
# Teste parametrizado: cada golden case individualmente
# ============================================================


@pytest.mark.asyncio
@pytest.mark.parametrize("case", GOLDEN_CASES, ids=[c["name"] for c in GOLDEN_CASES])
async def test_golden_case(mock_openai, case):
    """Roda cada golden case individualmente contra o AnalysisAgent mockado."""
    # Configure mock to return appropriate response for this case
    agent = AnalysisAgent()
    result = await agent.run(case["input_segments"])

    failures = _validate_case(result, case["expected"], case["name"])

    if failures:
        msg = "\n".join(failures)
        pytest.fail(f"Golden case '{case['name']}' falhou:\n{msg}")


# ============================================================
# Teste de regressão: taxa de sucesso > 80%
# ============================================================


@pytest.mark.asyncio
async def test_golden_regression_threshold(mock_openai):
    """
    Roda TODOS os golden cases e verifica que > 80% passam.
    Se mais de 20% falharem, o AnalysisAgent regrediu.
    """
    total = len(GOLDEN_CASES)
    if total == 0:
        pytest.skip("Nenhum golden case encontrado")

    passed = 0
    all_failures = []

    agent = AnalysisAgent()

    for case in GOLDEN_CASES:
        result = await agent.run(case["input_segments"])
        failures = _validate_case(result, case["expected"], case["name"])

        if not failures:
            passed += 1
        else:
            all_failures.extend(failures)

    pass_rate = passed / total
    assert pass_rate >= 0.8, (
        f"Regressão detectada! Taxa de sucesso: {pass_rate:.0%} ({passed}/{total})\n"
        f"Falhas:\n" + "\n".join(all_failures)
    )
