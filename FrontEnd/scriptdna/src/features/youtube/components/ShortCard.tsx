"use client";

import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCompactNumber, formatDate, formatDuration, formatPercentInt, formatScriptStatus } from "@/lib/formatters";
import { BarChart3, Clock, Eye, FileText, Link2, Sparkles, Video } from "lucide-react";
import type { YouTubeShort } from "@/types/api";

export function ShortCard({ short }: { short: YouTubeShort }) {
  const metrics = short.latest_metrics;
  const analysisStatus = short.analysis_status;
  const analyzed = !!analysisStatus?.has_performance_analysis;

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
            {formatCompactNumber(metrics?.views)} views
          </span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <BarChart3 className="h-3 w-3" />
            {formatPercentInt(metrics?.average_view_percentage)}
          </span>
        </div>

        <div className="flex flex-wrap gap-1">
          <Badge variant={analysisStatus?.has_transcript ? "default" : "outline"} className="text-[10px]">
            <FileText className="mr-1 h-3 w-3" />
            {analysisStatus?.has_transcript ? "Transcrito" : "Sem transcricao"}
          </Badge>
          <Badge variant={analyzed ? "default" : "outline"} className="text-[10px]">
            <Sparkles className="mr-1 h-3 w-3" />
            {analyzed ? "Analisado" : "Nao analisado"}
          </Badge>
          {short.script_link && (
            <Badge variant="outline" className="text-[10px]">
              <Link2 className="mr-1 h-3 w-3" />
              {formatScriptStatus(short.script_link.script_status ?? "draft")}
            </Badge>
          )}
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
