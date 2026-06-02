"use client";

import { useState, useMemo } from "react";
import { useScripts, useDeleteScript } from "@/hooks/use-scripts";
import { Card, CardContent } from "@/components/ui/card";
import { EducationalEmptyState } from "@/components/feedback/educational-empty-state";
import { LinkButton } from "@/components/ui/link-button";
import { ScriptsPageHeader } from "@/features/scripts/components/ScriptsPageHeader";
import { ScriptsFilterBar, type OriginFilter, type LinkedFilter } from "@/features/scripts/components/ScriptsFilterBar";
import { ScriptCard } from "@/features/scripts/components/ScriptCard";
import { Loader2, AlertCircle } from "lucide-react";
import type { ScriptStatus } from "@/types/api";

export default function ScriptsPage() {
  const [statusFilter, setStatusFilter] = useState<ScriptStatus | "all">("all");
  const [nicheFilter, setNicheFilter] = useState("");
  const [originFilter, setOriginFilter] = useState<OriginFilter>("all");
  const [linkedFilter, setLinkedFilter] = useState<LinkedFilter>("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const scripts = useScripts({
    status: statusFilter === "all" ? undefined : statusFilter,
    niche: nicheFilter.trim() || undefined,
  });
  const deleteScript = useDeleteScript();

  // Client-side filters for origin and linked video
  const filtered = useMemo(() => {
    const list = scripts.data ?? [];
    return list.filter((s) => {
      if (originFilter === "ai") {
        const by = s.current_version?.created_by;
        if (by !== "ai_generation" && by !== "ai_improvement" && by !== "ai") return false;
      }
      if (originFilter === "manual") {
        const by = s.current_version?.created_by;
        if (by === "ai_generation" || by === "ai_improvement" || by === "ai") return false;
      }
      if (linkedFilter === "linked" && !s.youtube_video_id) return false;
      if (linkedFilter === "unlinked" && s.youtube_video_id) return false;
      return true;
    });
  }, [scripts.data, originFilter, linkedFilter]);

  return (
    <div className="space-y-6">
      <ScriptsPageHeader />

      <ScriptsFilterBar
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        nicheFilter={nicheFilter}
        onNicheChange={setNicheFilter}
        originFilter={originFilter}
        onOriginChange={setOriginFilter}
        linkedFilter={linkedFilter}
        onLinkedChange={setLinkedFilter}
      />

      {scripts.isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : scripts.isError ? (
        <Card>
          <CardContent className="flex items-center gap-2 py-4 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span>Erro ao carregar roteiros</span>
          </CardContent>
        </Card>
      ) : !filtered.length ? (
        <EducationalEmptyState
          variant="no-scripts"
          action={<LinkButton href="/generate">Criar primeiro roteiro</LinkButton>}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((script) => (
            <ScriptCard
              key={script.id}
              script={script}
              isDeleting={deletingId === script.id}
              onDelete={() => {
                setDeletingId(script.id);
                deleteScript.mutate(script.id, {
                  onSettled: () => setDeletingId(null),
                });
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
