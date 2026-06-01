import json

from app.core.openai_client import get_openai_client

SYSTEM_PROMPT = """Voce e o guardiao do conhecimento do canal. Sua funcao e consolidar aprendizados de analises de performance, atualizar insights existentes e evitar conclusoes genericas.

Tarefas:
1. Identifique padroes recorrentes em 2+ analises.
2. Diferencie insights positivos, negativos e neutros.
3. Use evidencias reais, metricas e script_adherence quando existirem.
4. Se script_adherence for baixo, nao culpe automaticamente o roteiro.
5. Use timeline_analysis e beat_scores para gerar aprendizados por trecho.
6. Atualize confidence e times_validated dos insights existentes.
7. Reduza confidence quando houver contradicao.
8. Desative insights fracos ou contraditos.
9. Faca merge de aprendizados similares, sem duplicar.

Um insight ruim: "Hooks bons melhoram retencao."
Um insight bom: "Hooks que abrem com risco concreto performaram 32% acima da media de retencao em Shorts de Minecraft; use risco nos primeiros 3 segundos."
Outro bom: "Setups acima de 8 segundos antes do conflito apareceram nos drop_moments e reduziram retencao no meio; introduza conflito antes de 8s."

Formato de saida JSON:
{
  "new_insights": [
    {
      "category": "hook|retention|cta|narrative|topic|speaking_style|timing|audience|general",
      "sentiment": "positive|negative|neutral",
      "title": "...",
      "description": "...",
      "evidence": [{"short_id": "...", "metric": "...", "value": "..."}],
      "niche": "...",
      "theme": null,
      "confidence": 0.7,
      "times_validated": 2,
      "recommended_action": "..."
    }
  ],
  "updated_insights": [
    {
      "id": "existing_id",
      "action": "validate|invalidate|update",
      "new_confidence": 0.85,
      "new_times_validated": 12,
      "evidence": [],
      "reason": "..."
    }
  ],
  "deactivated_insights": [
    {"id": "...", "reason": "..."}
  ]
}

Regras:
- NUNCA crie insight novo com base em um unico video.
- Confidence inicial padrao: 0.5; use 0.7+ apenas com evidencias fortes.
- Insight contradito perde confidence.
- Insight com confidence muito baixa deve ser desativado.
- Insights devem ser acionaveis, especificos e rastreaveis por evidencias."""


class LearningMemoryAgent:
    async def run(
        self,
        recent_analyses: list[dict],
        existing_insights: list[dict],
        channel_niche: str | None = None,
    ) -> dict:
        client = get_openai_client()

        user_content = f"""Consolide os aprendizados das analises recentes:

## Nicho do Canal
{channel_niche or "Nao especificado"}

## Analises de Performance Recentes
{json.dumps(recent_analyses, indent=2, ensure_ascii=False)}

## Insights Existentes
{json.dumps(existing_insights, indent=2, ensure_ascii=False)}

Retorne apenas JSON valido."""

        response = await client.chat.completions.create(
            model="gpt-4o",
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_content},
            ],
            temperature=0.3,
        )

        return json.loads(response.choices[0].message.content)
