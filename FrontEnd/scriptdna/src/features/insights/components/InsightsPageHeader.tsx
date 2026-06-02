"use client";

import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";

interface InsightsPageHeaderProps {
  onGenerate: () => void;
  isGenerating: boolean;
}

export function InsightsPageHeader({ onGenerate, isGenerating }: InsightsPageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Aprendizados</h1>
        <p className="text-muted-foreground">
          O que a IA aprendeu sobre o seu canal — o que repetir, o que evitar e onde prestar atenção
        </p>
      </div>
      <Button
        onClick={onGenerate}
        disabled={isGenerating}
        data-testid="insights-generate-btn"
      >
        {isGenerating ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="mr-2 h-4 w-4" />
        )}
        {isGenerating ? "Analisando..." : "Gerar aprendizados"}
      </Button>
    </div>
  );
}
