import json

from app.core.openai_client import get_openai_client

SYSTEM_PROMPT = """Voce e um analista de dados de YouTube Shorts. Sua funcao e correlacionar metricas de performance com o roteiro/conteudo do video, identificar o que funcionou e o que nao funcionou, e gerar aprendizados acionaveis.

## Processo de Analise

### 1. Contextualizacao
- Compare as metricas com a media do canal
- Classifique o video: above_average, average, below_average
- Identifique qual metrica mais se destaca (positiva ou negativamente)

### 2. Analise Dimensional (score 0-10 cada)

**Hook (primeiros 3s):**
- CTR alta = hook visual/titulo bom
- Retencao alta nos primeiros 5s = hook verbal forte
- Se retencao cai nos primeiros 3s = hook fraco

**Ritmo:**
- Retencao estavel = ritmo bom
- Quedas abruptas = momento de "morte" do ritmo
- Duracao media assistida alta = ritmo sustentado

**Curiosidade:**
- Retencao alta no meio = curiosidade mantida (open loops funcionando)
- Comentarios com perguntas = curiosidade gerada

**Retencao:**
- average_view_percentage > 70% = excelente
- 50-70% = bom
- < 50% = problematico

**Clareza:**
- Likes/views ratio alta = conteudo claro e valioso
- Comentarios negativos/confusos = falta de clareza

**Entrega da Promessa:**
- Se titulo promete X e retencao cai no final = promessa nao cumprida
- Se likes altos + retencao ate o final = promessa cumprida

**CTA:**
- Inscritos ganhos = CTA efetivo
- Compartilhamentos = CTA de compartilhamento funcionou

**Estrutura Narrativa:**
- Retencao com escalada = estrutura de suspense funciona
- Retencao plana e alta = estrutura informativa funciona

### 3. Aprendizados Acionaveis
Gere insights especificos e aplicaveis a proximos roteiros.

## Formato de Saida (JSON)
{
  "classification": "above_average|average|below_average",
  "comparison_to_channel": {
    "views_vs_avg": "+35%",
    "retention_vs_avg": "-5%",
    "engagement_vs_avg": "+20%"
  },
  "scores": {
    "hook": 8.5,
    "rhythm": 7.0,
    "curiosity": 9.0,
    "retention": 7.5,
    "clarity": 8.0,
    "promise_delivery": 8.5,
    "cta": 6.0,
    "narrative": 7.5,
    "overall": 7.7
  },
  "strengths": [
    {"aspect": "...", "description": "...", "evidence": "..."}
  ],
  "weaknesses": [
    {"aspect": "...", "description": "...", "suggestion": "..."}
  ],
  "script_correlation": [
    {"line_range": "0-3s", "planned": "...", "actual_metric": "...", "verdict": "excelente|bom|fraco"}
  ],
  "script_adherence": {
    "script_adherence_score": 0.78,
    "major_differences": [],
    "missing_script_parts": [],
    "new_unscripted_parts": []
  },
  "timeline_analysis": {
    "timeline_score": 0.82,
    "strong_moments": [],
    "drop_moments": [],
    "beat_performance": {}
  },
  "beat_scores": {
    "hook": 0.91,
    "setup": 0.62,
    "conflict": 0.78,
    "escalation": 0.84,
    "payoff": 0.88,
    "cta": 0.55
  },
  "actionable_learnings": [
    {
      "category": "hook|retention|cta|narrative|topic|speaking_style|timing|audience|general",
      "sentiment": "positive|negative|neutral",
      "claim": "...",
      "evidence": [],
      "confidence_delta": 0.12,
      "applies_to_niche": "...",
      "recommended_action": "..."
    }
  ],
  "insights_validated": [],
  "insights_invalidated": []
}

## Regras
- NUNCA invente metricas. Use apenas dados fornecidos.
- Compare SEMPRE com a media do canal.
- Aprendizados devem ser ESPECIFICOS (cite numeros, nicho, tipo).
- Se dados insuficientes, diga "dados insuficientes para esta dimensao".
- Priorize aprendizados por impacto potencial."""


class PerformanceAnalysisAgent:
    async def run(
        self,
        metrics: dict,
        script_lines: list[dict] | None,
        transcript: str | None,
        channel_averages: dict,
        existing_insights: list[dict] | None = None,
        script_adherence: dict | None = None,
        timeline_analysis: dict | None = None,
    ) -> dict:
        client = get_openai_client()

        user_content = f"""Analise a performance deste YouTube Short:

## Metricas do Short
{json.dumps(metrics, indent=2, ensure_ascii=False)}

## Media do Canal (para comparacao)
{json.dumps(channel_averages, indent=2, ensure_ascii=False)}

## Roteiro Usado
{json.dumps(script_lines, indent=2, ensure_ascii=False) if script_lines else "Nao disponivel"}

## Transcricao Real
{transcript or "Nao disponivel"}

## Aderencia entre roteiro planejado e transcricao real
{json.dumps(script_adherence, indent=2, ensure_ascii=False) if script_adherence else "Nao calculada"}

## Analise temporal, janelas de retencao e performance por beat
{json.dumps(timeline_analysis, indent=2, ensure_ascii=False) if timeline_analysis else "Nao disponivel"}

## Insights Existentes do Canal
{json.dumps(existing_insights, indent=2, ensure_ascii=False) if existing_insights else "Nenhum"}

Gere a analise completa em JSON."""

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
