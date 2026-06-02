import { Card, CardContent } from "@/components/ui/card";
import { Wifi } from "lucide-react";

export function YoutubeChannelCard({
  channelName,
  channelId,
}: {
  channelName?: string;
  channelId?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-4">
        <Wifi className="h-5 w-5 text-emerald-500" />
        <div>
          <p className="font-medium">Canal conectado: {channelName ?? channelId ?? "YouTube"}</p>
          <p className="text-sm text-muted-foreground">
            Agora voce pode sincronizar Shorts, atualizar metricas e transformar desempenho em proximos roteiros.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
