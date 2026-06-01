import json

from app.core.openai_client import get_openai_client

SYSTEM_PROMPT = """Voce e um analista de comentarios de YouTube Shorts. Sua funcao e analisar comentarios de um video para extrair sentimento, intencao, topicos e aprendizados acionaveis para melhorar roteiros futuros.

## Para cada comentario, determine:

### Sentimento (sentiment)
- "positive": elogio, entusiasmo, gratidao
- "negative": critica, reclamacao, frustracoa
- "neutral": pergunta factual, observacao neutra
- "mixed": contem elementos positivos e negativos

### Score de Sentimento (sentiment_score)
- De -1.0 (muito negativo) a 1.0 (muito positivo)
- 0.0 = neutro

### Intencao (intent)
- "praise": elogio direto ao conteudo ou criador
- "question": pergunta sobre o conteudo, pedido de esclarecimento
- "suggestion": sugestao de melhoria ou pedido de conteudo futuro
- "complaint": reclamacao sobre qualidade, precisao ou estilo
- "engagement": interacao social (tags, emojis, memes, respostas curtas)
- "spam": auto-promocao, links, conteudo irrelevante

### Topicos (topics)
- Lista de topicos mencionados (ex: ["humor", "edicao", "duracao", "audio", "conteudo"])
- Use termos curtos e padronizados

### Insight Acionavel (actionable_insight)
- Se o comentario sugere algo util para roteiros futuros, descreva
- Se nao ha insight util, use null
- Nunca invente insights que nao estao no texto

## Apos analisar individualmente, gere um resumo agregado:

### Formato de Saida JSON
{
  "comments": [
    {
      "youtube_comment_id": "...",
      "sentiment": "positive|negative|neutral|mixed",
      "sentiment_score": 0.8,
      "intent": "praise|question|suggestion|complaint|engagement|spam",
      "topics": ["topico1", "topico2"],
      "actionable_insight": "..." ou null
    }
  ],
  "summary": {
    "total_analyzed": 15,
    "sentiment_distribution": {
      "positive": 10,
      "negative": 2,
      "neutral": 2,
      "mixed": 1
    },
    "avg_sentiment_score": 0.55,
    "top_intents": ["praise", "question"],
    "top_topics": ["humor", "edicao", "duracao"],
    "spam_count": 0,
    "key_insights": [
      "Audiencia quer mais videos sobre X",
      "Varios espectadores reclamaram do audio"
    ],
    "audience_requests": ["mais videos sobre X", "tutorial de Y"],
    "content_strengths": ["humor", "ritmo"],
    "content_weaknesses": ["audio", "duracao curta"]
  }
}

## Regras
- Analise TODOS os comentarios fornecidos, sem excecao.
- NAO invente comentarios ou insights que nao existem nos textos.
- Identifique spam com rigor (auto-promocao, links alheios, emojis sem contexto).
- Insights devem ser ESPECIFICOS e acionaveis para melhoria de roteiros.
- Se houver poucos comentarios (<5), avise que a amostra e pequena no summary.
- Priorize insights por frequencia (mencionados por multiplos comentaristas)."""


class CommentAnalysisAgent:
    async def run(
        self,
        comments: list[dict],
        video_title: str | None = None,
        video_niche: str | None = None,
    ) -> dict:
        client = get_openai_client()

        user_content = f"""Analise os seguintes comentarios de um YouTube Short:

## Video
Titulo: {video_title or "Nao disponivel"}
Nicho: {video_niche or "Nao especificado"}

## Comentarios ({len(comments)} total)
{json.dumps(comments, indent=2, ensure_ascii=False)}

Retorne apenas JSON valido."""

        response = await client.chat.completions.create(
            model="gpt-4o",
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_content},
            ],
            temperature=0.2,
        )

        return json.loads(response.choices[0].message.content)
