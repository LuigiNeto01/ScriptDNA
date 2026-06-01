from app.services.script_adherence_service import ScriptAdherenceService


def test_script_adherence_scores_similar_script_and_transcript():
    script_lines = [
        {"line": "Voce sabe por que isso muda tudo?"},
        {"line": "A resposta aparece quando compara os dois cenarios."},
    ]
    transcript = "Voce sabe por que isso muda tudo? A resposta aparece quando compara os dois cenarios."

    result = ScriptAdherenceService().compare(script_lines, transcript)

    assert result["script_adherence_score"] > 0.9
    assert result["major_differences"] == []


def test_script_adherence_detects_missing_and_unscripted_parts():
    script_lines = [
        {"line": "Primeiro mostre o erro que todo mundo comete."},
        {"line": "Depois entregue a solucao em tres passos."},
    ]
    transcript = "Hoje eu vou falar de outra historia totalmente diferente que nao estava no roteiro."

    result = ScriptAdherenceService().compare(script_lines, transcript)

    assert result["script_adherence_score"] < 0.5
    assert result["missing_script_parts"]
    assert result["new_unscripted_parts"]
