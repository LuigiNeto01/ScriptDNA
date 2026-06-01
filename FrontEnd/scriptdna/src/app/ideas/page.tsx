"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  useSuggestions,
  useUpdateSuggestion,
  useConvertSuggestion,
  useGenerateSuggestions,
} from "@/hooks/use-suggestions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sparkles,
  Loader2,
  AlertCircle,
  Check,
  X,
  FileText,
  Clock,
  ArrowRight,
} from "lucide-react";
import type { SuggestionCategory, SuggestionStatus } from "@/types/api";

const CATEGORY_LABELS: Record<SuggestionCategory, string> = {
  high_view_potential: "Alto Potencial de Views",
  high_retention_potential: "Alta Retencao",
  continuation: "Continuacao",
  variation: "Variacao",
  experiment: "Experimento",
  brand_reinforcement: "Reforco de Marca",
};

const STATUS_LABELS: Record<SuggestionStatus, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  pending: { label: "Pendente", variant: "secondary" },
  accepted: { label: "Aceita", variant: "default" },
  rejected: { label: "Rejeitada", variant: "destructive" },
  converted_to_script: { label: "Convertida", variant: "outline" },
};

export default function IdeasPage() {
  const router = useRouter();
  const [categoryFilter, setCategoryFilter] = useState<SuggestionCategory | "all">("all");
  const [statusFilter, setStatusFilter] = useState<SuggestionStatus | "all">("all");

  const suggestions = useSuggestions({
    category: categoryFilter === "all" ? undefined : categoryFilter,
    status: statusFilter === "all" ? undefined : statusFilter,
  });
  const updateSuggestion = useUpdateSuggestion();
  const convertSuggestion = useConvertSuggestion();
  const generateSuggestions = useGenerateSuggestions();

  function handleConvert(id: string) {
    convertSuggestion.mutate(id, {
      onSuccess: (res) => {
        router.push(`/scripts/${res.data.script_id}`);
      },
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sugestoes</h1>
          <p className="text-muted-foreground">Ideias de videos geradas pela IA</p>
        </div>
        <Button
          onClick={() => generateSuggestions.mutate()}
          disabled={generateSuggestions.isPending}
        >
          {generateSuggestions.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          Gerar Sugestoes
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as SuggestionCategory | "all")}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
              <SelectItem key={val} value={val}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as SuggestionStatus | "all")}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(STATUS_LABELS).map(([val, { label }]) => (
              <SelectItem key={val} value={val}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Suggestions List */}
      {suggestions.isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : suggestions.isError ? (
        <Card>
          <CardContent className="flex items-center gap-2 py-4 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span>Erro ao carregar sugestoes</span>
          </CardContent>
        </Card>
      ) : !suggestions.data?.items?.length ? (
        <EmptyState
          icon={Sparkles}
          title="Nenhuma sugestao"
          description="Gere sugestoes de videos baseadas na analise do seu canal."
          action={
            <Button onClick={() => generateSuggestions.mutate()} disabled={generateSuggestions.isPending}>
              Gerar Sugestoes
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {suggestions.data.items.map((suggestion) => {
            const statusInfo = STATUS_LABELS[suggestion.status];
            return (
              <Card key={suggestion.id} className="flex flex-col">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base line-clamp-2">{suggestion.title}</CardTitle>
                    <Badge variant={statusInfo.variant} className="shrink-0">{statusInfo.label}</Badge>
                  </div>
                  <Badge variant="outline" className="w-fit text-xs">
                    {CATEGORY_LABELS[suggestion.category]}
                  </Badge>
                </CardHeader>
                <CardContent className="flex-1 space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-3">{suggestion.description}</p>

                  {suggestion.justification && (
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium">Justificativa:</span>
                      <p className="mt-0.5 line-clamp-2">{suggestion.justification}</p>
                    </div>
                  )}

                  {suggestion.suggested_hook && (
                    <div className="text-xs">
                      <span className="font-medium text-muted-foreground">Hook sugerido:</span>
                      <p className="mt-0.5 italic">&ldquo;{suggestion.suggested_hook}&rdquo;</p>
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {suggestion.estimated_duration_seconds && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {suggestion.estimated_duration_seconds}s
                      </span>
                    )}
                    {suggestion.niche && <span>Nicho: {suggestion.niche}</span>}
                    {suggestion.confidence_score != null && (
                      <span>Confianca: {Math.round(suggestion.confidence_score * 100)}%</span>
                    )}
                  </div>

                  {/* Actions */}
                  {suggestion.status === "pending" && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => updateSuggestion.mutate({ id: suggestion.id, status: "accepted" })}
                        disabled={updateSuggestion.isPending}
                      >
                        <Check className="mr-1 h-3.5 w-3.5" />
                        Aceitar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => updateSuggestion.mutate({ id: suggestion.id, status: "rejected" })}
                        disabled={updateSuggestion.isPending}
                      >
                        <X className="mr-1 h-3.5 w-3.5" />
                        Rejeitar
                      </Button>
                    </div>
                  )}

                  {(suggestion.status === "pending" || suggestion.status === "accepted") && (
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => handleConvert(suggestion.id)}
                      disabled={convertSuggestion.isPending}
                    >
                      {convertSuggestion.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <FileText className="mr-2 h-4 w-4" />
                      )}
                      Converter em Roteiro
                      <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  )}

                  {suggestion.status === "converted_to_script" && suggestion.converted_script_id && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => router.push(`/scripts/${suggestion.converted_script_id}`)}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Ver Roteiro
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
