import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/link-button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Loader2, Video } from "lucide-react";
import { formatDuration } from "@/lib/formatters";
import type { Video as VideoType } from "@/types/api";

interface RecentReferencesPanelProps {
  videos: VideoType[];
  isLoading: boolean;
}

export function RecentReferencesPanel({ videos, isLoading }: RecentReferencesPanelProps) {
  return (
    <Card data-testid="recent-references-panel">
      <CardHeader>
        <CardTitle>Referências Recentes</CardTitle>
        <CardDescription>Últimos vídeos processados na biblioteca</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !videos.length ? (
          <div className="py-8 text-center">
            <Video className="h-8 w-8 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium">Nenhuma referência ainda</p>
            <p className="text-xs text-muted-foreground mt-1">
              Importe vídeos de criadores que você admira para calibrar o estilo da IA.
            </p>
            <LinkButton href="/import" size="sm" className="mt-3">
              Importar referência
            </LinkButton>
          </div>
        ) : (
          <div className="space-y-2">
            {videos.map((video) => (
              <Link
                key={video.id}
                href={`/videos/${video.id}`}
                className="flex flex-col gap-2 rounded-lg border p-3 transition-colors hover:bg-accent sm:flex-row sm:items-center sm:justify-between"
                data-testid="recent-video-item"
              >
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="truncate text-sm font-medium">{video.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {video.creator_name ?? "Criador não informado"} ·{" "}
                    {video.niche ?? "Sem nicho"} ·{" "}
                    {formatDuration(video.duration_seconds)}
                  </span>
                </div>
                <div className="shrink-0">
                  <StatusBadge status={video.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
