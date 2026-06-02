import { EducationalEmptyState } from "@/components/feedback/educational-empty-state";
import { LinkButton } from "@/components/ui/link-button";

export function ReferenceEmptyState({ isSearching }: { isSearching: boolean }) {
  return (
    <EducationalEmptyState
      variant="no-references"
      title={isSearching ? "Nenhuma referencia encontrada" : "Voce ainda nao adicionou referencias"}
      description={
        isSearching
          ? "Tente buscar por outra ideia, nicho ou estilo."
          : "Adicione videos, textos ou links para a IA aprender o estilo, ritmo e estrutura que voce quer seguir."
      }
      tips={
        isSearching
          ? ["Busque por uma promessa do video", "Experimente o nome do criador", "Remova filtros muito especificos"]
          : ["Use videos de canais que inspiram seu formato", "Cole roteiros que representam seu estilo", "Separe referencias por nicho para resultados melhores"]
      }
      action={!isSearching ? <LinkButton href="/import">Adicionar referencia</LinkButton> : undefined}
    />
  );
}
