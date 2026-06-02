"use client";

import { formatDuration } from "@/lib/formatters";

interface SuggestionReasonPanelProps {
  justification?: string | null;
  suggestedHook?: string | null;
  suggestedStructure?: string | null;
  estimatedDuration?: number | null;
  niche?: string | null;
  confidenceScore?: number | null;
}

export function SuggestionReasonPanel({
  justification,
  suggestedHook,
  suggestedStructure,
  estimatedDuration,
  niche,
  confidenceScore,
}: SuggestionReasonPanelProps) {
  return (
    <div className="space-y-2 text-xs text-muted-foreground" data-testid="suggestion-reason-panel">
      {justification && (
        <div>
          <span className="font-medium text-foreground">Por que criar este vídeo:</span>
          <p className="mt-0.5">{justification}</p>
        </div>
      )}
      {suggestedHook && (
        <div>
          <span className="font-medium text-foreground">Abertura sugerida:</span>
          <p className="mt-0.5 italic">&ldquo;{suggestedHook}&rdquo;</p>
        </div>
      )}
      {suggestedStructure && (
        <div>
          <span className="font-medium text-foreground">Estrutura:</span>
          <p className="mt-0.5">{suggestedStructure}</p>
        </div>
      )}
      <div className="flex items-center gap-3 flex-wrap">
        {estimatedDuration != null && (
          <span>
            Duração: <strong>{formatDuration(estimatedDuration)}</strong>
          </span>
        )}
        {niche && (
          <span>
            Nicho: <strong>{niche}</strong>
          </span>
        )}
        {confidenceScore != null && (
          <span>
            Confiança: <strong>{Math.round(confidenceScore * 100)}%</strong>
          </span>
        )}
      </div>
    </div>
  );
}
