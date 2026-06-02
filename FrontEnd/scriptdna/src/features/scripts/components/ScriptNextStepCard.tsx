"use client";

import { Card, CardContent } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/link-button";
import { ArrowRight, Video, BarChart2, CheckCircle2 } from "lucide-react";
import type { Script } from "@/types/api";

interface ScriptNextStepCardProps {
  script: Script;
}

export function ScriptNextStepCard({ script }: ScriptNextStepCardProps) {
  // State 3: Script was analyzed — performance data available
  if (script.status === "analyzed") {
    return (
      <Card className="border-green-500/30 bg-green-500/5" data-testid="next-step-analyzed">
        <CardContent className="py-4 flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-sm">Roteiro analisado</p>
              <p className="text-xs text-muted-foreground">
                Este roteiro tem dados de desempenho do Short vinculado.
              </p>
            </div>
          </div>
          <LinkButton href="/youtube" variant="outline" size="sm">
            Ver Short
            <ArrowRight className="ml-2 h-4 w-4" />
          </LinkButton>
        </CardContent>
      </Card>
    );
  }

  // State 2: Script has linked video but not yet analyzed
  if (script.youtube_video_id) {
    return (
      <Card className="border-blue-500/30 bg-blue-500/5" data-testid="next-step-linked">
        <CardContent className="py-4 flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <BarChart2 className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-sm">Short vinculado</p>
              <p className="text-xs text-muted-foreground">
                Analise o desempenho para descobrir o que funcionou.
              </p>
            </div>
          </div>
          <LinkButton href="/youtube" variant="outline" size="sm">
            Ver desempenho
            <ArrowRight className="ml-2 h-4 w-4" />
          </LinkButton>
        </CardContent>
      </Card>
    );
  }

  // State 1: Draft or approved without linked video
  return (
    <Card className="border-amber-500/30 bg-amber-500/5" data-testid="next-step-no-video">
      <CardContent className="py-4 flex items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <Video className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-sm">Próximo passo: grave o roteiro</p>
            <p className="text-xs text-muted-foreground">
              Depois de gravar, vincule o Short aqui para acompanhar o desempenho.
            </p>
          </div>
        </div>
        <LinkButton href="/youtube" variant="outline" size="sm">
          Ir para Shorts
          <ArrowRight className="ml-2 h-4 w-4" />
        </LinkButton>
      </CardContent>
    </Card>
  );
}
