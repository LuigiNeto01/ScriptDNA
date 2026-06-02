"use client";

import { ScriptLineCard } from "@/features/generate/components/ScriptLineCard";
import type { ScriptLine } from "@/types/api";

interface ScriptLineListProps {
  lines: ScriptLine[];
}

export function ScriptLineList({ lines }: ScriptLineListProps) {
  if (!lines.length) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        Nenhum conteúdo nesta versão
      </p>
    );
  }

  return (
    <div className="space-y-2" data-testid="script-line-list">
      {lines.map((line, i) => (
        <ScriptLineCard key={i} line={line} index={i} />
      ))}
    </div>
  );
}
