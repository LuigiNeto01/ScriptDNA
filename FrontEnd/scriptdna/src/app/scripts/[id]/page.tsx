"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import {
  useScript,
  useScriptVersions,
  useUpdateScriptStatus,
  useCreateVersion,
} from "@/hooks/use-scripts";
import { useImproveScript } from "@/hooks/use-generate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { formatTechnicalTerm } from "@/lib/formatters";
import type { ScriptLine, ScriptStatus, ScriptVersion } from "@/types/api";

import { ScriptDetailHeader } from "@/features/scripts/components/detail/ScriptDetailHeader";
import { ScriptVersionTimeline } from "@/features/scripts/components/detail/ScriptVersionTimeline";
import { ScriptEditor } from "@/features/scripts/components/detail/ScriptEditor";
import { ScriptLineList } from "@/features/scripts/components/detail/ScriptLineList";
import { ScriptContextExplanation } from "@/features/scripts/components/detail/ScriptContextExplanation";
import { ScriptLinkedShortCard } from "@/features/scripts/components/detail/ScriptLinkedShortCard";
import { ScriptActionPanel } from "@/features/scripts/components/detail/ScriptActionPanel";
import { ScriptNextStepCard } from "@/features/scripts/components/ScriptNextStepCard";

export default function ScriptDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const script = useScript(id);
  const versions = useScriptVersions(id);
  const updateStatus = useUpdateScriptStatus(id);
  const createVersion = useCreateVersion(id);
  const improveScript = useImproveScript();

  const [selectedVersion, setSelectedVersion] = useState<ScriptVersion | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState("");

  const currentVersion = selectedVersion ?? script.data?.current_version;
  const lines = (currentVersion?.lines ?? []) as ScriptLine[];
  const generationParams = currentVersion?.generation_params as
    | { context_snapshot?: unknown }
    | null
    | undefined;

  function handleImprove() {
    if (!lines.length) return;
    const scriptText = lines.map((l) => l.line).join("\n");
    improveScript.mutate(
      { script_text: scriptText, focus: "retention" },
      {
        onSuccess: (res) => {
          const improved = res.data;
          createVersion.mutate({
            lines: improved.improved_lines,
            analysis: improved.analysis,
            change_summary: `Melhoria IA: ${improved.problems_found?.join(", ") ?? "otimizado"}`,
            created_by: "ai_improvement",
          });
        },
      }
    );
  }

  function handleStartEdit() {
    setEditText(lines.map((l) => l.line).join("\n"));
    setIsEditing(true);
  }

  function handleSaveEdit() {
    const newLines = editText
      .split("\n")
      .filter(Boolean)
      .map((line, i) => ({
        start: String(i * 3),
        end: String((i + 1) * 3),
        line,
        function: "development",
        retention_note: "",
      }));
    createVersion.mutate(
      { lines: newLines, change_summary: "Edição manual", created_by: "user" },
      { onSuccess: () => setIsEditing(false) }
    );
  }

  if (script.isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!script.data) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Roteiro não encontrado
      </div>
    );
  }

  const s = script.data;

  return (
    <div className="space-y-6">
      <ScriptDetailHeader
        script={s}
        onStatusChange={(status: ScriptStatus) => updateStatus.mutate(status)}
        isUpdating={updateStatus.isPending}
      />

      <ScriptNextStepCard script={s} />

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        {/* Main Content */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="flex items-center gap-2">
                  Versão {currentVersion?.version_number ?? 1}
                  {currentVersion?.created_by && (
                    <Badge variant="outline" className="text-xs font-normal">
                      {formatTechnicalTerm(currentVersion.created_by)}
                    </Badge>
                  )}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <ScriptEditor
                  value={editText}
                  onChange={setEditText}
                  onSave={handleSaveEdit}
                  onCancel={() => setIsEditing(false)}
                  isSaving={createVersion.isPending}
                />
              ) : (
                <ScriptLineList lines={lines} />
              )}

              {/* Analysis summary */}
              {!isEditing && currentVersion?.analysis && (
                <div className="mt-4 rounded-lg border p-4 space-y-2">
                  <h4 className="font-semibold text-sm">Análise</h4>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      Gancho:{" "}
                      <strong>
                        {Math.round(
                          ((currentVersion.analysis.hook_strength as number) ?? 0) * 100
                        )}
                        %
                      </strong>
                    </div>
                    <div>
                      Ganchos de curiosidade:{" "}
                      <strong>
                        {(currentVersion.analysis.curiosity_gaps as string[])?.length ?? 0}
                      </strong>
                    </div>
                    <div>
                      Pontos fracos:{" "}
                      <strong>
                        {(currentVersion.analysis.weak_points as string[])?.length ?? 0}
                      </strong>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Context explanation */}
          {!!generationParams?.context_snapshot && (
            <ScriptContextExplanation
              snapshot={generationParams.context_snapshot}
              analysis={currentVersion?.analysis}
            />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <ScriptActionPanel
            canImprove={lines.length > 0}
            isImproving={improveScript.isPending || createVersion.isPending}
            isEditing={isEditing}
            onImprove={handleImprove}
            onToggleEdit={() => {
              if (isEditing) {
                setIsEditing(false);
              } else {
                handleStartEdit();
              }
            }}
          />

          <ScriptLinkedShortCard scriptId={id} youtubeVideoId={s.youtube_video_id} />

          <ScriptVersionTimeline
            versions={versions.data}
            isLoading={versions.isLoading}
            currentVersionId={currentVersion?.id}
            onSelectVersion={(v) => {
              setSelectedVersion(v);
              setIsEditing(false);
            }}
          />
        </div>
      </div>
    </div>
  );
}
