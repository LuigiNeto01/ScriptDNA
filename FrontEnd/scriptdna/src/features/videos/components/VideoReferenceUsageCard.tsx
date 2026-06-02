import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/link-button";
import { PenTool } from "lucide-react";

export function VideoReferenceUsageCard({ videoId }: { videoId: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Proximo passo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>
          Use esta referencia para gerar um roteiro que aproveita padroes parecidos sem copiar o conteudo original.
        </p>
        <LinkButton href={`/generate?style_from=${videoId}`}>
          <PenTool className="h-4 w-4" />
          Criar roteiro inspirado nela
        </LinkButton>
      </CardContent>
    </Card>
  );
}
