"use client";

import { EducationalEmptyState } from "@/components/feedback/educational-empty-state";
import { LinkButton } from "@/components/ui/link-button";

export function StrategyEmptyState() {
  return (
    <EducationalEmptyState
      variant="default"
      title="Sua estratégia semanal ainda não foi criada"
      description="Quando você tiver Shorts analisados, a IA poderá montar um plano de ação com tendências e recomendações."
      tips={[
        "Analise pelo menos 5 Shorts para gerar tendências internas",
        "A estratégia inclui o que repetir, o que testar e o que evitar",
        "Use as sugestões de próximos vídeos como ponto de partida",
      ]}
      action={<LinkButton href="/youtube">Analisar Shorts</LinkButton>}
      secondaryAction={
        <LinkButton href="/insights" variant="outline">
          Ver aprendizados
        </LinkButton>
      }
    />
  );
}
