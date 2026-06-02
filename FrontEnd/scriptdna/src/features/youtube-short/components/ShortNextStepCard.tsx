import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, PenTool, Sparkles } from "lucide-react";
import type { PerformanceAnalysis, YouTubeShort } from "@/types/api";

export function ShortNextStepCard({
  short,
  analysis,
  onFetchTranscript,
  onAnalyze,
}: {
  short: YouTubeShort;
  analysis: PerformanceAnalysis | null | undefined;
  onFetchTranscript: () => void;
  onAnalyze: () => void;
}) {
  if (!short.transcript) {
    return (
      <NextStep title="Buscar transcricao" description="A IA precisa entender o que foi falado antes de comparar roteiro, retencao e comentarios.">
        <Button onClick={onFetchTranscript}>
          <FileText className="h-4 w-4" />
          Buscar transcricao
        </Button>
      </NextStep>
    );
  }

  if (!analysis) {
    return (
      <NextStep title="Analisar Short" description="A analise mostra o que funcionou, onde houve queda e quais aprendizados podem virar proximos roteiros.">
        <Button onClick={onAnalyze}>
          <Sparkles className="h-4 w-4" />
          Analisar desempenho
        </Button>
      </NextStep>
    );
  }

  return (
    <NextStep title="Criar proximo roteiro" description="Use os aprendizados deste Short para gerar uma nova versao mais alinhada ao que segurou atencao.">
      <Link href={`/generate?goal=Usar aprendizados do Short ${short.id}`}>
        <Button>
          <PenTool className="h-4 w-4" />
          Gerar roteiro usando aprendizados
        </Button>
      </Link>
    </NextStep>
  );
}

function NextStep({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{description}</p>
        {children}
      </CardContent>
    </Card>
  );
}
