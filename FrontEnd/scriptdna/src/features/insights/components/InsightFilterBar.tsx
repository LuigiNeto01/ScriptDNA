"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORY_LABELS } from "./InsightCard";
import type { InsightCategory } from "@/types/api";

export type SentimentGroup = "all" | "positive" | "negative" | "neutral";
export type ConfidenceFilter = "all" | "high" | "medium" | "low";

const GROUP_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "positive", label: "O que repetir" },
  { value: "negative", label: "O que evitar" },
  { value: "neutral", label: "Pontos de atenção" },
] as const;

interface InsightFilterBarProps {
  sentimentGroup: SentimentGroup;
  onSentimentGroupChange: (v: SentimentGroup) => void;
  categoryFilter: InsightCategory | "all";
  onCategoryChange: (v: InsightCategory | "all") => void;
  activeOnly: boolean;
  onActiveOnlyChange: (v: boolean) => void;
  confidenceFilter: ConfidenceFilter;
  onConfidenceChange: (v: ConfidenceFilter) => void;
  nicheFilter: string;
  onNicheChange: (v: string) => void;
}

export function InsightFilterBar({
  sentimentGroup,
  onSentimentGroupChange,
  categoryFilter,
  onCategoryChange,
  activeOnly,
  onActiveOnlyChange,
  confidenceFilter,
  onConfidenceChange,
  nicheFilter,
  onNicheChange,
}: InsightFilterBarProps) {
  return (
    <div className="flex flex-wrap gap-2 items-center">
      {/* Sentiment group */}
      <div className="flex gap-1 rounded-md border p-1">
        {GROUP_OPTIONS.map((opt) => (
          <Button
            key={opt.value}
            variant={sentimentGroup === opt.value ? "default" : "ghost"}
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => onSentimentGroupChange(opt.value)}
            data-testid={`insights-group-${opt.value}`}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      {/* Category */}
      <Select
        value={categoryFilter}
        onValueChange={(v) => onCategoryChange(v as InsightCategory | "all")}
      >
        <SelectTrigger className="w-[170px]" data-testid="insights-category-filter">
          <SelectValue placeholder="Categoria" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as categorias</SelectItem>
          {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
            <SelectItem key={val} value={val}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Confidence */}
      <Select
        value={confidenceFilter}
        onValueChange={(v) => onConfidenceChange(v as ConfidenceFilter)}
      >
        <SelectTrigger className="w-[150px]" data-testid="insights-confidence-filter">
          <SelectValue placeholder="Confiança" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toda confiança</SelectItem>
          <SelectItem value="high">Alta confiança</SelectItem>
          <SelectItem value="medium">Confiança média</SelectItem>
          <SelectItem value="low">Baixa confiança</SelectItem>
        </SelectContent>
      </Select>

      {/* Niche */}
      <Input
        placeholder="Filtrar por nicho"
        value={nicheFilter}
        onChange={(e) => onNicheChange(e.target.value)}
        className="w-[160px]"
        data-testid="insights-niche-filter"
      />

      {/* Active only toggle */}
      <Button
        variant={activeOnly ? "default" : "outline"}
        size="sm"
        className="h-8 text-xs"
        onClick={() => onActiveOnlyChange(!activeOnly)}
        data-testid="insights-active-toggle"
      >
        {activeOnly ? "Ativos" : "Todos"}
      </Button>
    </div>
  );
}
