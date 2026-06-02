"use client";

import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";

interface IdeasPageHeaderProps {
  onGenerate: () => void;
  isGenerating: boolean;
}

export function IdeasPageHeader({ onGenerate, isGenerating }: IdeasPageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Próximos Vídeos</h1>
        <p className="text-muted-foreground">
          Sugestões da IA baseadas no que funciona no seu canal
        </p>
      </div>
      <Button
        onClick={onGenerate}
        disabled={isGenerating}
        data-testid="ideas-generate-btn"
      >
        {isGenerating ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="mr-2 h-4 w-4" />
        )}
        {isGenerating ? "Gerando sugestões..." : "Gerar sugestões"}
      </Button>
    </div>
  );
}
