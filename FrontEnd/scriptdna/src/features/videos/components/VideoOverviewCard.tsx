import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatDuration } from "@/lib/formatters";
import type { VideoDetail } from "@/types/api";

export function VideoOverviewCard({ video }: { video: VideoDetail }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">O que esta referencia ensina</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>
          A IA usa este conteudo para reconhecer ritmo, estrutura narrativa, tipo de abertura e escolhas de retencao que podem inspirar novos roteiros.
        </p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{video.source_type}</Badge>
          <Badge variant="outline">{video.visibility ?? "private"}</Badge>
          <Badge variant="outline">{formatDuration(video.duration_seconds)}</Badge>
          <Badge variant="outline">{formatDate(video.created_at)}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
