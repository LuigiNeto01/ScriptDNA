import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import type { YouTubeShort } from "@/types/api";

export function ShortTranscriptPanel({ short }: { short: YouTubeShort }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-4 w-4" />
          Transcricao
        </CardTitle>
      </CardHeader>
      <CardContent>
        {short.transcript ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{short.transcript}</p>
        ) : (
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Ainda nao temos a transcricao deste Short.</p>
            <p>Busque a transcricao para a IA entender o que foi falado e conectar isso ao desempenho.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
