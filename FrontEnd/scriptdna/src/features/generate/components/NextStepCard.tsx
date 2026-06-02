"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { ArrowRight, CheckCircle2, Copy, FileText, Library } from "lucide-react";
import { copyScriptLines } from "../utils/generate-copy";
import type { GeneratedScript } from "@/types/api";

interface NextStepCardProps {
  script: GeneratedScript;
}

export function NextStepCard({ script }: NextStepCardProps) {
  const [copied, setCopied] = useState(false);
  const savedScriptId = script.script_id ?? null;
  const isSaved = !!savedScriptId;

  const handleCopy = async () => {
    await copyScriptLines(script.lines);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          {isSaved ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Roteiro salvo com sucesso
            </>
          ) : (
            <>
              <ArrowRight className="h-4 w-4 text-primary" />
              Próximo passo
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {isSaved
            ? "Agora você pode revisar, copiar ou publicar esse roteiro. Depois, volte para analisar o desempenho do Short."
            : "Gostou desse roteiro? Salve uma versão para acompanhar melhorias e vincular o resultado depois."}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={handleCopy}>
            {copied ? (
              <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-green-500" />
            ) : (
              <Copy className="h-3.5 w-3.5 mr-1" />
            )}
            {copied ? "Copiado!" : "Copiar roteiro"}
          </Button>

          {isSaved && savedScriptId && (
            <LinkButton size="sm" href={`/scripts/${savedScriptId}`}>
              <FileText className="h-3.5 w-3.5 mr-1" />
              Abrir roteiro salvo
            </LinkButton>
          )}

          <LinkButton size="sm" variant="ghost" href="/scripts">
            <Library className="h-3.5 w-3.5 mr-1" />
            Ver meus roteiros
          </LinkButton>
        </div>
      </CardContent>
    </Card>
  );
}
