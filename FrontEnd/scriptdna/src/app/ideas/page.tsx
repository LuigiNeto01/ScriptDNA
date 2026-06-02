"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  useSuggestions,
  useUpdateSuggestion,
  useConvertSuggestion,
  useGenerateSuggestions,
} from "@/hooks/use-suggestions";
import { Card, CardContent } from "@/components/ui/card";
import { EducationalEmptyState } from "@/components/feedback/educational-empty-state";
import { LinkButton } from "@/components/ui/link-button";
import { IdeasPageHeader } from "@/features/ideas/components/IdeasPageHeader";
import { SuggestionFilterBar } from "@/features/ideas/components/SuggestionFilterBar";
import { SuggestionCard } from "@/features/ideas/components/SuggestionCard";
import { Loader2, AlertCircle } from "lucide-react";
import type { SuggestionCategory, SuggestionStatus } from "@/types/api";

export default function IdeasPage() {
  const router = useRouter();
  const [categoryFilter, setCategoryFilter] = useState<SuggestionCategory | "all">("all");
  const [statusFilter, setStatusFilter] = useState<SuggestionStatus | "all">("all");
  const [convertingId, setConvertingId] = useState<string | null>(null);

  const suggestions = useSuggestions({
    category: categoryFilter === "all" ? undefined : categoryFilter,
    status: statusFilter === "all" ? undefined : statusFilter,
  });
  const updateSuggestion = useUpdateSuggestion();
  const convertSuggestion = useConvertSuggestion();
  const generateSuggestions = useGenerateSuggestions();

  function handleConvert(id: string) {
    setConvertingId(id);
    convertSuggestion.mutate(id, {
      onSuccess: (res) => {
        router.push(`/scripts/${res.data.script_id}`);
      },
      onSettled: () => setConvertingId(null),
    });
  }

  return (
    <div className="space-y-6">
      <IdeasPageHeader
        onGenerate={() => generateSuggestions.mutate()}
        isGenerating={generateSuggestions.isPending}
      />

      <SuggestionFilterBar
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
      />

      {suggestions.isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : suggestions.isError ? (
        <Card>
          <CardContent className="flex items-center gap-2 py-4 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span>Erro ao carregar sugestões</span>
          </CardContent>
        </Card>
      ) : !suggestions.data?.items?.length ? (
        <EducationalEmptyState
          variant="no-ideas"
          title="Ainda não há sugestões de vídeos"
          description="Gere sugestões com base nos Shorts e aprendizados do canal."
          tips={[
            "Quanto mais Shorts analisados, melhores as sugestões",
            "Aceite ou rejeite sugestões para treinar a IA",
            "Converta diretamente em roteiro com um clique",
          ]}
          action={<LinkButton href="/youtube">Analisar Shorts</LinkButton>}
          secondaryAction={
            <LinkButton href="/generate" variant="outline">
              Criar roteiro manualmente
            </LinkButton>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" data-testid="ideas-grid">
          {suggestions.data.items.map((suggestion) => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              onAccept={(id) => updateSuggestion.mutate({ id, status: "accepted" })}
              onReject={(id) => updateSuggestion.mutate({ id, status: "rejected" })}
              onConvert={handleConvert}
              isUpdating={updateSuggestion.isPending}
              isConverting={convertSuggestion.isPending}
              convertingId={convertingId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
