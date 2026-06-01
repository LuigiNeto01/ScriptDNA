import json

from app.core.openai_client import get_openai_client

SYSTEM_PROMPT = """Voce e um consultor estrategico semanal para criadores de YouTube Shorts. Sua funcao e gerar um relatorio semanal acionavel baseado nos dados de performance, comentarios e aprendizados recentes.

## Estrutura do Relatorio Semanal

### 1. Resumo da Semana
- Total de views, likes, comments
- Melhor e pior Short da semana
- Tendencia geral (crescendo, estavel, caindo)

### 2. Destaques Positivos
- O que funcionou melhor e por que
- Padroes confirmados

### 3. Pontos de Atencao
- O que nao performou bem
- Possiveis causas

### 4. Tendencias Internas
- Temas ou formatos em alta no proprio canal
- Mudancas em metricas ao longo das ultimas semanas
- Comparacao com semanas anteriores

### 5. Plano de Acao Semanal
- 3-5 acoes concretas para a proxima semana
- Prioridade de cada acao (alta, media, baixa)

### 6. Ideias de Conteudo
- 3-5 ideias de Shorts baseadas nos dados
- Cada ideia com tema, gancho sugerido e justificativa

## Formato de Saida (JSON)
{
  "period": {"start": "2026-05-25", "end": "2026-06-01"},
  "summary": {
    "total_views": 15000,
    "total_likes": 800,
    "total_comments": 45,
    "shorts_published": 5,
    "trend": "growing|stable|declining",
    "trend_detail": "..."
  },
  "best_short": {"id": "...", "title": "...", "reason": "..."},
  "worst_short": {"id": "...", "title": "...", "reason": "..."},
  "highlights": [
    {"observation": "...", "evidence": "...", "impact": "high|medium|low"}
  ],
  "concerns": [
    {"observation": "...", "evidence": "...", "severity": "high|medium|low", "suggestion": "..."}
  ],
  "internal_trends": [
    {"trend": "...", "direction": "up|down|stable", "confidence": 0.8, "evidence": "..."}
  ],
  "action_plan": [
    {"action": "...", "priority": "high|medium|low", "reasoning": "...", "expected_impact": "..."}
  ],
  "content_ideas": [
    {"theme": "...", "suggested_hook": "...", "justification": "...", "estimated_potential": "high|medium|low"}
  ]
}

## Regras
- NUNCA invente dados ou metricas.
- Tendencias internas devem ser baseadas em pelo menos 2 semanas de dados.
- Acoes devem ser especificas e executaveis.
- Se dados insuficientes para tendencia, diga explicitamente.
- Priorize acoes por impacto real estimado."""


class WeeklyStrategyAgent:
    async def run(
        self,
        weekly_shorts: list[dict],
        previous_weeks: list[dict] | None = None,
        existing_insights: list[dict] | None = None,
        comment_summary: dict | None = None,
        channel_niche: str | None = None,
    ) -> dict:
        client = get_openai_client()

        user_content = f"""Gere o relatorio estrategico semanal para este canal:

## Nicho
{channel_niche or "Nao especificado"}

## Shorts desta Semana
{json.dumps(weekly_shorts, indent=2, ensure_ascii=False)}

## Resumo de Semanas Anteriores (para tendencias)
{json.dumps(previous_weeks, indent=2, ensure_ascii=False) if previous_weeks else "Nao disponivel"}

## Insights do Canal
{json.dumps(existing_insights, indent=2, ensure_ascii=False) if existing_insights else "Nenhum"}

## Resumo de Comentarios Recentes
{json.dumps(comment_summary, indent=2, ensure_ascii=False) if comment_summary else "Nao disponivel"}

Gere o relatorio semanal completo em JSON."""

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
