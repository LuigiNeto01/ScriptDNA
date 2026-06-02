"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/link-button";
import { SuggestionPriorityBadge } from "./SuggestionPriorityBadge";
import { SuggestionReasonPanel } from "./SuggestionReasonPanel";
import { Check, X, FileText, ArrowRight, Loader2 } from "lucide-react";
import type { VideoSuggestion } from "@/types/api";

const STATUS_LABELS: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  pending: { label: "Pendente", variant: "secondary" },
  accepted: { label: "Aceita", variant: "default" },
  rejected: { label: "Rejeitada", variant: "destructive" },
  converted_to_script: { label: "Convertida em roteiro", variant: "outline" },
};

interface SuggestionCardProps {
  suggestion: VideoSuggestion;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onConvert: (id: string) => void;
  isUpdating?: boolean;
  isConverting?: boolean;
  convertingId?: string | null;
}

export function SuggestionCard({
  suggestion,
  onAccept,
  onReject,
  onConvert,
  isUpdating = false,
  isConverting = false,
  convertingId = null,
}: SuggestionCardProps) {
  const statusInfo = STATUS_LABELS[suggestion.status] ?? {
    label: suggestion.status,
    variant: "outline" as const,
  };
  const isThisConverting = isConverting && convertingId === suggestion.id;

  const params = new URLSearchParams();
  if (suggestion.theme) params.set("theme", suggestion.theme);
  if (suggestion.niche) params.set("niche", suggestion.niche);
  params.set("idea", suggestion.title);
  const generateHref = `/generate?${params.toString()}`;

  return (
    <Card className="flex flex-col" data-testid="suggestion-card">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base line-clamp-2">{suggestion.title}</CardTitle>
          <Badge variant={statusInfo.variant} className="shrink-0 text-xs">
            {statusInfo.label}
          </Badge>
        </div>
        <SuggestionPriorityBadge category={suggestion.category} />
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-3">{suggestion.description}</p>

        <SuggestionReasonPanel
          justification={suggestion.justification}
          suggestedHook={suggestion.suggested_hook}
          suggestedStructure={suggestion.suggested_structure}
          estimatedDuration={suggestion.estimated_duration_seconds}
          niche={suggestion.niche}
          confidenceScore={suggestion.confidence_score}
        />

        {/* Pending: accept/reject */}
        {suggestion.status === "pending" && (
          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-8"
              onClick={() => onAccept(suggestion.id)}
              disabled={isUpdating}
              data-testid="suggestion-accept-btn"
            >
              <Check className="mr-1 h-3.5 w-3.5" />
              Aceitar
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-8"
              onClick={() => onReject(suggestion.id)}
              disabled={isUpdating}
              data-testid="suggestion-reject-btn"
            >
              <X className="mr-1 h-3.5 w-3.5" />
              Rejeitar
            </Button>
          </div>
        )}

        {/* Convert */}
        {(suggestion.status === "pending" || suggestion.status === "accepted") && (
          <Button
            size="sm"
            className="w-full"
            onClick={() => onConvert(suggestion.id)}
            disabled={isThisConverting}
            data-testid="suggestion-convert-btn"
          >
            {isThisConverting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileText className="mr-2 h-4 w-4" />
            )}
            Criar roteiro com essa ideia
            <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        )}

        {/* Already converted */}
        {suggestion.status === "converted_to_script" && suggestion.converted_script_id && (
          <LinkButton
            href={`/scripts/${suggestion.converted_script_id}`}
            variant="outline"
            size="sm"
            className="w-full"
            data-testid="suggestion-view-script-btn"
          >
            <FileText className="mr-2 h-4 w-4" />
            Ver roteiro criado
          </LinkButton>
        )}

        {/* Quick generate link */}
        {suggestion.status !== "converted_to_script" && (
          <LinkButton
            href={generateHref}
            variant="ghost"
            size="sm"
            className="w-full text-xs text-muted-foreground hover:text-foreground"
            data-testid="suggestion-generate-btn"
          >
            Gerar roteiro sobre isso
          </LinkButton>
        )}
      </CardContent>
    </Card>
  );
}
