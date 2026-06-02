"use client";

import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";

interface StrategyPageHeaderProps {
  onGenerate: () => void;
  isGenerating: boolean;
}

export function StrategyPageHeader({ onGenerate, isGenerating }: StrategyPageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Estratégia da semana</h1>
        <p className="text-muted-foreground">
          Tendências do seu canal e plano de ação para os próximos vídeos
        </p>
      </div>
      <Button
        onClick={onGenerate}
        disabled={isGenerating}
        data-testid="strategy-generate-btn"
      >
        {isGenerating ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="mr-2 h-4 w-4" />
        )}
        {isGenerating ? "Gerando estratégia..." : "Gerar estratégia semanal"}
      </Button>
    </div>
  );
}
