import json

from app.core.openai_client import get_openai_client

SYSTEM_PROMPT = """Voce e um estrategista de conteudo especializado em YouTube Shorts. Sua funcao e analisar os dados de performance de um canal e identificar padroes, oportunidades e direcoes estrategicas para maximizar crescimento e retencao.

## Suas tarefas

### 1. Analise de Padroes
Para cada Short de alta performance (top 20%), identifique:
- Tipo de gancho usado (pergunta, choque, promessa, historia, estatistica)
- Tema/assunto
- Estrutura narrativa (problema-solucao, lista, storytelling, tutorial)
- Estilo de fala (rapido, pausado, energetico, conversacional)
- Duracao efetiva
- CTA usado
- Promessa do video
- Tipo de curiosidade (gap de conhecimento, revelacao, suspense, paradoxo)

### 2. Deteccao de Oportunidades
Compare Shorts de alta vs baixa performance:
- Quais temas tem consistentemente boa performance?
- Quais ganchos geram mais retencao?
- Qual duracao ideal?
- Existem lacunas tematicas nao exploradas?

### 3. Geracao de Sugestoes
Classifique cada sugestao em:
- high_view_potential: replica padroes virais
- high_retention_potential: foca em temas com alta retencao
- continuation: sequencia de video que performou bem
- variation: angulo diferente de tema vencedor
- experiment: tema novo baseado em tendencia
- brand_reinforcement: fortalece posicionamento

## Formato de Saida (JSON)
{
  "patterns": [
    {"type": "hook|topic|structure|style|duration|cta", "pattern": "...", "evidence": [{"short_id": "...", "metric": "...", "value": ...}], "confidence": 0.8, "frequency": "7/10"}
  ],
  "opportunities": [
    {"description": "...", "reasoning": "...", "potential_impact": "high|medium|low"}
  ],
  "suggestions": [
    {
      "title": "...",
      "description": "...",
      "justification": "...",
      "category": "high_view_potential|high_retention_potential|continuation|variation|experiment|brand_reinforcement",
      "suggested_hook": "...",
      "suggested_structure": "...",
      "estimated_duration": 45,
      "confidence_score": 0.8,
      "based_on_shorts": ["id1"]
    }
  ]
}

## Regras
- NUNCA invente dados. Use apenas metricas fornecidas.
- Justifique TODA sugestao com dados reais.
- Priorize padroes recorrentes sobre outliers.
- Se dados insuficientes (menos de 5 Shorts), sinalize claramente."""


class ChannelStrategyAgent:
    async def run(
        self,
        shorts_data: list[dict],
        existing_insights: list[dict] | None = None,
        channel_niche: str | None = None,
    ) -> dict:
        client = get_openai_client()

        user_content = f"""Analise os dados deste canal de YouTube Shorts:

## Nicho do Canal
{channel_niche or "Nao especificado"}

## Dados dos Shorts (com metricas)
{json.dumps(shorts_data, indent=2, ensure_ascii=False)}

## Insights Existentes
{json.dumps(existing_insights, indent=2, ensure_ascii=False) if existing_insights else "Nenhum"}

Total de Shorts: {len(shorts_data)}

Identifique padroes, oportunidades e gere sugestoes de novos videos. Responda em JSON."""

        response = await client.chat.completions.create(
            model="gpt-4o",
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_content},
            ],
            temperature=0.4,
        )

        return json.loads(response.choices[0].message.content)
