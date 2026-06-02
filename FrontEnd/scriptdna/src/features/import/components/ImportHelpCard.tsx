import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";

export function ImportHelpCard() {
  return (
    <Card className="bg-muted/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Lightbulb className="h-4 w-4" />
          Referencia nao e Short do seu canal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <p>
          Use esta tela para adicionar exemplos que inspiram seu estilo: roteiros, links, audios ou videos de referencia.
        </p>
        <p>
          Para trazer Shorts reais do seu canal, use a tela do YouTube e sincronize por la.
        </p>
      </CardContent>
    </Card>
  );
}
