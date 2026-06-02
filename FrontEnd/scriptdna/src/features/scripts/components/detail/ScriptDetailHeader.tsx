"use client";

import { LinkButton } from "@/components/ui/link-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Clock } from "lucide-react";
import { formatDuration } from "@/lib/formatters";
import type { Script, ScriptStatus } from "@/types/api";

const STATUS_OPTIONS: { value: ScriptStatus; label: string }[] = [
  { value: "draft", label: "Rascunho" },
  { value: "approved", label: "Aprovado" },
  { value: "published", label: "Publicado" },
  { value: "analyzed", label: "Analisado" },
  { value: "archived", label: "Arquivado" },
];

interface ScriptDetailHeaderProps {
  script: Script;
  onStatusChange: (status: ScriptStatus) => void;
  isUpdating?: boolean;
}

export function ScriptDetailHeader({
  script,
  onStatusChange,
  isUpdating = false,
}: ScriptDetailHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4" data-testid="script-detail-header">
      <div className="flex items-center gap-4">
        <LinkButton href="/scripts" variant="ghost" size="sm" aria-label="Voltar para roteiros">
          <ArrowLeft className="h-4 w-4" />
        </LinkButton>
        <div>
          <h1 className="text-2xl font-bold">{script.title}</h1>
          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground flex-wrap">
            {script.theme && <span>{script.theme}</span>}
            {script.niche && (
              <>
                <span>&middot;</span>
                <span>{script.niche}</span>
              </>
            )}
            {script.estimated_duration_seconds != null && (
              <>
                <span>&middot;</span>
                <Clock className="h-3.5 w-3.5" />
                <span>{formatDuration(script.estimated_duration_seconds)}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <Select
        value={script.status}
        onValueChange={(v) => onStatusChange(v as ScriptStatus)}
        disabled={isUpdating}
      >
        <SelectTrigger className="w-[140px]" data-testid="script-status-select">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
