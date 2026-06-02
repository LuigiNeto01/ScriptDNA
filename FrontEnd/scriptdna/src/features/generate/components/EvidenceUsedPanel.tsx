"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { GeneratedScript } from "@/types/api";

interface CollapsibleListProps {
  title: string;
  items: string[];
}

function CollapsibleList({ title, items }: CollapsibleListProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-sm font-medium hover:bg-muted/50 transition-colors"
        aria-expanded={open}
      >
        <span>{title}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{items.length}</span>
          {open ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>
      {open && (
        <div className="border-t px-4 py-3">
          <ul className="space-y-1.5">
            {items.map((item, i) => (
              <li key={i} className="text-xs text-muted-foreground">
                • {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

interface EvidenceUsedPanelProps {
  script: GeneratedScript;
}

export function EvidenceUsedPanel({ script }: EvidenceUsedPanelProps) {
  const panels: Array<{ title: string; items: string[] }> = [];

  // Analysis-level arrays (guard against non-array values from imperfect mocks)
  const curiosityGaps = Array.isArray(script.analysis.curiosity_gaps)
    ? script.analysis.curiosity_gaps
    : [];
  const weakPoints = Array.isArray(script.analysis.weak_points)
    ? script.analysis.weak_points
    : [];

  if (curiosityGaps.length > 0) {
    panels.push({ title: "Ganchos de curiosidade", items: curiosityGaps });
  }
  if (weakPoints.length > 0) {
    panels.push({ title: "Pontos para melhorar", items: weakPoints });
  }

  // Root-level arrays
  const rootPanels: Array<{ key: keyof GeneratedScript; title: string }> = [
    { key: "evidence_used", title: "Referências usadas" },
    { key: "patterns_applied", title: "Padrões aplicados" },
    { key: "patterns_avoided", title: "Padrões evitados" },
    { key: "predicted_retention_risks", title: "Riscos de retenção" },
    { key: "improvement_suggestions", title: "Sugestões de melhoria" },
  ];

  for (const { key, title } of rootPanels) {
    const items = script[key];
    if (Array.isArray(items) && items.length > 0) {
      panels.push({ title, items: items as string[] });
    }
  }

  if (panels.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Detalhes da geração
      </p>
      {panels.map((p) => (
        <CollapsibleList key={p.title} title={p.title} items={p.items} />
      ))}
    </div>
  );
}
