import json

from app.core.openai_client import get_openai_client

CRITIC_PROMPT = """Você é um crítico de roteiros especializado em retenção de audiência.

Analise o roteiro abaixo e identifique problemas:
- Hook fraco ou genérico
- Payoff antecipado (revela demais cedo)
- Frases longas demais (>20 palavras)
- Falta de pergunta implícita (curiosity gap)
- Queda de ritmo no meio do vídeo
- Falta de variação emocional

Gere uma versão melhorada do roteiro e liste os problemas encontrados.

IMPORTANTE sobre o campo "function":
- Use APENAS um destes valores: hook, setup, conflict, escalation, payoff, cta
- Cada linha do roteiro DEVE ter uma dessas funções narrativas.

IMPORTANTE sobre o campo "weak_points":
- Liste APENAS os pontos genuinamente fracos do roteiro (score abaixo de 7/10).
- Descreva o problema de forma clara e acionável (ex: "CTA fraco, não gera urgência").
- NÃO liste beats que estão bons ou com score alto. Se não houver pontos fracos, retorne [].

Responda APENAS com JSON válido:
{
  "improved_lines": [
    {
      "start": "0.0",
      "end": "3.0",
      "line": "texto melhorado",
      "function": "hook",
      "retention_note": "nota"
    }
  ],
  "problems_found": ["problema 1", "problema 2"],
  "analysis": {
    "hook_strength": 0.9,
    "curiosity_gaps": ["pergunta implícita 1"],
    "weak_points": ["descrição do problema acionável"]
  }
}
"""


class RetentionCriticAgent:
    async def run(self, lines: list[dict], goal: str | None = None) -> dict:
        if not lines:
            raise ValueError("Roteiro vazio")

        script_text = json.dumps(lines, ensure_ascii=False)
        user_content = f"Roteiro:\n{script_text}"
        if goal:
            user_content += f"\n\nObjetivo: {goal}"

        client = get_openai_client()
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": CRITIC_PROMPT},
                {"role": "user", "content": user_content},
            ],
            response_format={"type": "json_object"},
            temperature=0.4,
        )

        return json.loads(response.choices[0].message.content)
