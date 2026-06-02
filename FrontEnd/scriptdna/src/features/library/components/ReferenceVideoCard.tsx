"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { ReferenceStatusBadge } from "./ReferenceStatusBadge";
import { ReferenceVisibilityBadge } from "./ReferenceVisibilityBadge";
import { formatDate, formatDuration } from "@/lib/formatters";
import { Clock, ExternalLink, Trash2 } from "lucide-react";
import type { Video } from "@/types/api";

export function ReferenceVideoCard({
  video,
  onDelete,
  variant = "grid",
}: {
  video: Video;
  onDelete: (id: string) => void;
  variant?: "grid" | "list";
}) {
  const details = (
    <div className="min-w-0 flex-1 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <ReferenceStatusBadge status={video.status} />
        <ReferenceVisibilityBadge visibility={video.visibility} />
        <Badge variant="outline">{video.source_type}</Badge>
      </div>
      <CardTitle className="line-clamp-2 text-base">{video.title}</CardTitle>
      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span>{video.creator_name ?? "Criador nao informado"}</span>
        <span>{video.niche ?? "Sem nicho"}</span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatDuration(video.duration_seconds)}
        </span>
        <span>{formatDate(video.created_at)}</span>
      </div>
    </div>
  );

  const actions = (
    <div className="flex shrink-0 items-center gap-1">
      <Button variant="ghost" size="icon-sm" aria-label="Abrir detalhe">
        <ExternalLink className="h-4 w-4" />
      </Button>
      <ConfirmDialog
        trigger={
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:text-destructive"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            aria-label="Excluir referencia"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        }
        title="Excluir referencia?"
        description={`"${video.title}" sera removido da sua biblioteca.`}
        confirmLabel="Excluir"
        onConfirm={() => onDelete(video.id)}
      />
    </div>
  );

  if (variant === "list") {
    return (
      <Link href={`/videos/${video.id}`} data-testid="video-list-item">
        <Card className="transition-colors hover:bg-accent/50">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
            {details}
            {actions}
          </CardContent>
        </Card>
      </Link>
    );
  }

  return (
    <Link href={`/videos/${video.id}`} data-testid="video-card">
      <Card className="h-full transition-colors hover:border-primary/50">
        <CardHeader className="flex-row items-start gap-3">
          {details}
          {actions}
        </CardHeader>
      </Card>
    </Link>
  );
}
