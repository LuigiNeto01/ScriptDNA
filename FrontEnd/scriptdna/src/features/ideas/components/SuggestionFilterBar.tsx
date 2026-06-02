"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SuggestionCategory, SuggestionStatus } from "@/types/api";

const CATEGORY_LABELS: Record<SuggestionCategory, string> = {
  high_view_potential: "Alto potencial",
  high_retention_potential: "Bom para retenção",
  continuation: "Continuação recomendada",
  variation: "Variação de tema vencedor",
  experiment: "Experimento",
  brand_reinforcement: "Reforço de marca",
};

const STATUS_LABELS: Record<SuggestionStatus, string> = {
  pending: "Pendente",
  accepted: "Aceita",
  rejected: "Rejeitada",
  converted_to_script: "Convertida",
};

interface SuggestionFilterBarProps {
  categoryFilter: SuggestionCategory | "all";
  onCategoryChange: (v: SuggestionCategory | "all") => void;
  statusFilter: SuggestionStatus | "all";
  onStatusChange: (v: SuggestionStatus | "all") => void;
}

export function SuggestionFilterBar({
  categoryFilter,
  onCategoryChange,
  statusFilter,
  onStatusChange,
}: SuggestionFilterBarProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Select
        value={categoryFilter}
        onValueChange={(v) => onCategoryChange(v as SuggestionCategory | "all")}
      >
        <SelectTrigger className="w-[220px]" data-testid="ideas-category-filter">
          <SelectValue placeholder="Potencial" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os potenciais</SelectItem>
          {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
            <SelectItem key={val} value={val}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={statusFilter}
        onValueChange={(v) => onStatusChange(v as SuggestionStatus | "all")}
      >
        <SelectTrigger className="w-[160px]" data-testid="ideas-status-filter">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os status</SelectItem>
          {Object.entries(STATUS_LABELS).map(([val, label]) => (
            <SelectItem key={val} value={val}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
