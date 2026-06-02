"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, GitBranch } from "lucide-react";
import { formatDate, formatTechnicalTerm } from "@/lib/formatters";
import type { ScriptVersion } from "@/types/api";

interface ScriptVersionTimelineProps {
  versions: ScriptVersion[] | undefined;
  isLoading: boolean;
  currentVersionId: string | undefined;
  onSelectVersion: (version: ScriptVersion) => void;
}

export function ScriptVersionTimeline({
  versions,
  isLoading,
  currentVersionId,
  onSelectVersion,
}: ScriptVersionTimelineProps) {
  return (
    <Card data-testid="script-version-timeline">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <GitBranch className="h-4 w-4" />
          Histórico de versões
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" />
        ) : !versions?.length ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            Nenhuma versão salva ainda
          </p>
        ) : (
          versions.map((v) => (
            <button
              key={v.id}
              onClick={() => onSelectVersion(v)}
              className={`w-full text-left rounded-lg border p-3 text-sm transition-colors hover:bg-accent ${
                currentVersionId === v.id ? "border-primary bg-accent" : ""
              }`}
              data-testid="script-version-item"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">v{v.version_number}</span>
                <span className="text-xs text-muted-foreground">
                  {formatTechnicalTerm(v.created_by)}
                </span>
              </div>
              {v.change_summary && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {v.change_summary}
                </p>
              )}
              <span className="text-xs text-muted-foreground">
                {formatDate(v.created_at)}
              </span>
            </button>
          ))
        )}
      </CardContent>
    </Card>
  );
}
