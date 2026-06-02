"use client";

import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCompactNumber, formatDate, formatDuration, formatPercentInt } from "@/lib/formatters";
import { usePerformanceAnalysis } from "@/hooks/use-analysis";
import { useShortMetrics } from "@/hooks/use-youtube";
import { BarChart3, Clock, Eye, FileText, Sparkles, Video } from "lucide-react";
import type { YouTubeShort } from "@/types/api";

export function ShortCard({ short }: { short: YouTubeShort }) {
  const metrics = useShortMetrics(short.id);
  const analysis = usePerformanceAnalysis(short.id);
  const m = metrics.data;
  const analyzed = !!analysis.data;

  return (
    <Card className="h-full overflow-hidden transition-colors hover:bg-accent/50">
      <Link href={`/youtube/shorts/${short.id}`}>
        {short.thumbnail_url ? (
          <div className="relative aspect-[9/16] max-h-56 w-full overflow-hidden bg-muted">
            <Image src={short.thumbnail_url} alt={short.title ?? "Short"} fill unoptimized className="object-cover" />
          </div>
        ) : (
          <div className="flex h-40 items-center justify-center bg-muted">
            <Video className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
      </Link>
      <CardContent className="space-y-3 p-3">
        <div>
          <Link href={`/youtube/shorts/${short.id}`} className="line-clamp-2 text-sm font-medium hover:underline">
            {short.title ?? "Sem titulo"}
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {short.duration_seconds != null && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDuration(short.duration_seconds)}
              </span>
            )}
            <span>{formatDate(short.published_at)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <span className="flex items-center gap-1 text-muted-foreground">
            <Eye className="h-3 w-3" />
            {formatCompactNumber(m?.views)} views
          </span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <BarChart3 className="h-3 w-3" />
            {formatPercentInt(m?.average_view_percentage)}
          </span>
        </div>

        <div className="flex flex-wrap gap-1">
          <Badge variant={short.transcript ? "default" : "outline"} className="text-[10px]">
            <FileText className="mr-1 h-3 w-3" />
            {short.transcript ? "Transcrito" : "Sem transcricao"}
          </Badge>
          <Badge variant={analyzed ? "default" : "outline"} className="text-[10px]">
            <Sparkles className="mr-1 h-3 w-3" />
            {analyzed ? "Analisado" : "Nao analisado"}
          </Badge>
          {short.script_id && <Badge variant="outline" className="text-[10px]">Com roteiro</Badge>}
        </div>

        <Link href={`/youtube/shorts/${short.id}`}>
          <Button size="sm" className="w-full">
            Analisar
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
