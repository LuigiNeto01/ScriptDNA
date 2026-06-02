import { EducationalEmptyState } from "@/components/feedback/educational-empty-state";

export function ShortsEmptyState({ connected }: { connected: boolean }) {
  if (!connected) {
    return (
      <EducationalEmptyState
        variant="no-youtube"
        title="Seu canal ainda nao esta conectado"
        description="Conecte para a IA analisar seus Shorts reais e aprender com desempenho, retencao e comentarios."
        tips={["O acesso e somente leitura", "Voce pode desconectar quando quiser", "A IA usa esses dados para sugerir proximos roteiros"]}
      />
    );
  }

  return (
    <EducationalEmptyState
      variant="no-youtube"
      title="Canal conectado, sem Shorts sincronizados"
      description="Sincronize seus Shorts para comecar a analise visual e transformar desempenho em aprendizados."
      tips={["Shorts antigos tambem ajudam", "A analise roda em segundo plano", "Quanto mais historico, melhores ficam as recomendacoes"]}
    />
  );
}
