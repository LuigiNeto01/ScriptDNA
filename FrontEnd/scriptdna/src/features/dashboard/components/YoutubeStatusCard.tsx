import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/link-button";

interface YoutubeStatusCardProps {
  connected: boolean;
  channelName?: string | null;
}

export function YoutubeStatusCard({ connected, channelName }: YoutubeStatusCardProps) {
  return (
    <Card data-testid="youtube-status-card">
      <CardHeader>
        <CardTitle>Canal YouTube</CardTitle>
        <CardDescription>Conexão e status</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
          <div>
            <p className="text-sm font-medium">
              {connected ? channelName ?? "Canal conectado" : "Canal não conectado"}
            </p>
            <p className="text-xs text-muted-foreground">
              {connected
                ? "Pronto para sincronizar Shorts"
                : "Conecte para importar seus Shorts"}
            </p>
          </div>
          <Badge variant={connected ? "default" : "secondary"}>
            {connected ? "Ativo" : "Pendente"}
          </Badge>
        </div>
        <LinkButton href="/youtube" className="w-full" variant="outline">
          {connected ? "Gerenciar canal" : "Conectar YouTube"}
        </LinkButton>
      </CardContent>
    </Card>
  );
}
