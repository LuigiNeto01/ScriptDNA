import json

from app.core.openai_client import get_openai_client

ANALYSIS_PROMPT = """Você é um analista de roteiros especializado em retenção de audiência para vídeos curtos e longos no YouTube, TikTok e Reels.

Sua tarefa é classificar cada segmento de transcrição em um beat narrativo, identificar técnicas de retenção e avaliar a qualidade.

## BEATS NARRATIVOS (use APENAS estes valores)

### hook (primeiros 3-10 segundos — a parte MAIS CRÍTICA)
O hook é o que decide se o espectador fica ou sai. Analise com atenção máxima:
- Ele cria uma PERGUNTA na mente do espectador? (curiosity gap)
- Ele QUEBRA um padrão esperado? (pattern interrupt)
- Ele faz uma PROMESSA clara do que o vídeo vai entregar?
- Ele usa CONTRASTE, CHOQUE ou dado surpreendente?
- Ele é ESPECÍFICO (bom) ou GENÉRICO (ruim)?
Um hook genérico como "Nesse vídeo vou falar sobre..." é fraco. Um hook como "97% das pessoas fazem isso errado e perdem dinheiro" é forte.

### setup
Contextualiza o problema ou tema. Estabelece por que o espectador deve se importar. Cria identificação ("você já passou por isso?").

### conflict
Apresenta o obstáculo, a dor, o problema central. Aumenta a tensão e o investimento emocional do espectador.

### escalation
Intensifica o conflito, adiciona camadas, reviravoltas ou dados que amplificam a tensão. Mantém o espectador preso antes da resolução.

### payoff
Entrega a resolução, a resposta, o "como fazer". É o momento que o hook prometeu. Se o payoff não cumpre a promessa do hook, a retenção cai.

### cta
Call to action — pede like, inscrição, comentário, ou direciona para outro conteúdo. Pode aparecer no meio (soft CTA) ou no final (hard CTA).

## TÉCNICAS DE RETENÇÃO
Identifique quais técnicas cada segmento usa:
- curiosity_gap: cria pergunta não respondida que puxa o espectador adiante
- open_loop: abre um assunto que só será fechado depois ("daqui a pouco eu explico")
- pattern_interrupt: quebra expectativa com algo inesperado (tom, ritmo, informação)
- contrast: compara antes/depois, certo/errado, expectativa/realidade
- cliffhanger: interrompe no ponto de maior tensão
- specificity: usa números, dados ou detalhes concretos em vez de generalizações
- social_proof: menciona resultados de outros, autoridade, validação externa
- urgency: cria senso de escassez ou tempo limitado
- storytelling: usa narrativa pessoal ou de terceiros para ilustrar

## CAMPOS POR SEGMENTO
- beat_type: o beat narrativo (hook/setup/conflict/escalation/payoff/cta)
- techniques: lista de técnicas com confiança (0.0-1.0) e evidência textual
- curiosity_question: a pergunta implícita que o segmento planta na mente do espectador (se houver)
- attention_goal: o que este segmento tenta fazer com a atenção do espectador (ex: "prender nos primeiros segundos", "criar tensão antes da revelação")
- retention_function: função de retenção (ex: "abrir curiosidade", "manter tensão", "entregar promessa")
- emotion: emoção principal evocada (curiosidade, surpresa, medo, empolgação, alívio, urgência, etc.)
- intensity_score: 0.0 a 1.0 — o quão forte é esse segmento no que se propõe a fazer

## REGRAS
- O primeiro segmento (ou primeiros segmentos até ~10s) quase sempre é hook. Analise-o com rigor máximo.
- Um vídeo pode ter mais de um hook (re-hook no meio para recuperar atenção).
- Nem todo segmento precisa ter curiosity_question — só preencha se realmente existir.
- Seja honesto no intensity_score: um hook genérico merece score baixo mesmo que o restante do vídeo seja bom.

Responda APENAS com JSON válido:
{
  "beats": [
    {
      "segment_index": 0,
      "beat_type": "hook",
      "techniques": [{"name": "curiosity_gap", "confidence": 0.9, "evidence": "trecho exato do texto"}],
      "curiosity_question": "pergunta que fica na mente do espectador",
      "attention_goal": "objetivo de atenção",
      "retention_function": "função de retenção",
      "emotion": "emoção evocada",
      "intensity_score": 0.8
    }
  ]
}
"""


class AnalysisAgent:
    async def run(self, segments: list[dict]) -> dict:
        if not segments:
            raise ValueError("Lista de segmentos vazia")

        segments_text = "\n".join(
            f"[{i}] ({s['start']:.1f}s - {s['end']:.1f}s): {s['text']}"
            for i, s in enumerate(segments)
        )

        client = get_openai_client()
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": ANALYSIS_PROMPT},
                {"role": "user", "content": segments_text},
            ],
            response_format={"type": "json_object"},
            temperature=0.3,
        )

        content = response.choices[0].message.content
        return json.loads(content)
