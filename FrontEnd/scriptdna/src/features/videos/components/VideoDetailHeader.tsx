import Link from "next/link";
import { LinkButton } from "@/components/ui/link-button";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDuration } from "@/lib/formatters";
import { ArrowLeft, Clock, PenTool } from "lucide-react";
import type { VideoDetail } from "@/types/api";

export function VideoDetailHeader({ video }: { video: VideoDetail }) {
  return (
    <div className="space-y-4">
      <Link href="/library" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Voltar para referencias
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">{video.title}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span>{video.creator_name ?? "Criador nao informado"}</span>
            <span>{video.niche ?? "Sem nicho"}</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDuration(video.duration_seconds)}
            </span>
            <StatusBadge status={video.status} />
          </div>
        </div>
        <LinkButton href={`/generate?style_from=${video.id}`}>
          <PenTool className="h-4 w-4" />
          Gerar roteiro com esta referencia
        </LinkButton>
      </div>
    </div>
  );
}
