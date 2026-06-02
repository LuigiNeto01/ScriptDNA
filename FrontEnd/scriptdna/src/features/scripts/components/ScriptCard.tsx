"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { ScriptStatusBadge } from "./ScriptStatusBadge";
import { Clock, Trash2, Sparkles, User, Link2 } from "lucide-react";
import { formatDate, formatDuration } from "@/lib/formatters";
import type { Script } from "@/types/api";

interface ScriptCardProps {
  script: Script;
  onDelete: () => void;
  isDeleting?: boolean;
}

export function ScriptCard({ script, onDelete, isDeleting = false }: ScriptCardProps) {
  const isAiGenerated =
    script.current_version?.created_by === "ai_generation" ||
    script.current_version?.created_by === "ai_improvement" ||
    script.current_version?.created_by === "ai";

  return (
    <Link href={`/scripts/${script.id}`} data-testid="script-card-link">
      <Card className="h-full transition-colors hover:bg-accent/50 cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base line-clamp-2">{script.title}</CardTitle>
            <ScriptStatusBadge status={script.status} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            {script.theme && (
              <span className="line-clamp-1">Tema: {script.theme}</span>
            )}
            {script.niche && <span>Nicho: {script.niche}</span>}
            <div className="flex items-center gap-3">
              {script.estimated_duration_seconds != null && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{formatDuration(script.estimated_duration_seconds)}</span>
                </div>
              )}
              {isAiGenerated && (
                <div className="flex items-center gap-1 text-xs">
                  <Sparkles className="h-3 w-3" />
                  <span>IA</span>
                </div>
              )}
              {!isAiGenerated && script.current_version && (
                <div className="flex items-center gap-1 text-xs">
                  <User className="h-3 w-3" />
                  <span>Manual</span>
                </div>
              )}
              {script.youtube_video_id && (
                <div className="flex items-center gap-1 text-xs text-primary/80">
                  <Link2 className="h-3 w-3" />
                  <span>Short vinculado</span>
                </div>
              )}
            </div>
            <span className="text-xs">{formatDate(script.updated_at)}</span>
          </div>
          <div className="mt-3 flex justify-end">
            <ConfirmDialog
              trigger={
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="Excluir roteiro"
                  data-testid="script-delete-btn"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              }
              title="Excluir roteiro?"
              description={`O roteiro "${script.title}" será excluído permanentemente.`}
              confirmLabel="Excluir"
              onConfirm={onDelete}
              loading={isDeleting}
            />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
