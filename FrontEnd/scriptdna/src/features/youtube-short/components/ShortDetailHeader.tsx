import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock } from "lucide-react";
import { formatDate, formatDuration } from "@/lib/formatters";
import type { YouTubeShort } from "@/types/api";

export function ShortDetailHeader({ short }: { short: YouTubeShort }) {
  return (
    <div className="space-y-4">
      <Link href="/youtube">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4" />
          Voltar para YouTube
        </Button>
      </Link>

      <div className="grid gap-4 lg:grid-cols-[160px_1fr]">
        {short.thumbnail_url ? (
          <div className="relative aspect-[9/16] max-h-64 overflow-hidden rounded-lg bg-muted">
            <Image src={short.thumbnail_url} alt={short.title ?? "Short"} fill unoptimized className="object-cover" />
          </div>
        ) : null}
        <div className="space-y-3">
          <h1 className="text-2xl font-bold tracking-tight">{short.title ?? "Short sem titulo"}</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {short.youtube_video_id && <Badge variant="outline">{short.youtube_video_id}</Badge>}
            {short.duration_seconds != null && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {formatDuration(short.duration_seconds)}
              </span>
            )}
            <span>{formatDate(short.published_at)}</span>
            <Badge variant={short.transcript ? "default" : "outline"}>
              {short.transcript ? "Transcrito" : "Sem transcricao"}
            </Badge>
            {short.script_id && <Badge variant="outline">Roteiro vinculado</Badge>}
          </div>
          {short.description && <p className="line-clamp-3 text-sm text-muted-foreground">{short.description}</p>}
        </div>
      </div>
    </div>
  );
}
