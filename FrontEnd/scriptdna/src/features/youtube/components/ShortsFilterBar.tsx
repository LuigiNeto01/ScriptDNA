"use client";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type ShortsFilter = "all" | "analyzed" | "not_analyzed" | "with_transcript" | "without_transcript" | "linked" | "unlinked";
export type ShortsSort = "recent" | "views" | "retention" | "engagement";

export function ShortsFilterBar({
  filter,
  sort,
  onFilterChange,
  onSortChange,
}: {
  filter: ShortsFilter;
  sort: ShortsSort;
  onFilterChange: (filter: ShortsFilter) => void;
  onSortChange: (sort: ShortsSort) => void;
}) {
  const filters: Array<{ value: ShortsFilter; label: string }> = [
    { value: "all", label: "Todos" },
    { value: "analyzed", label: "Analisados" },
    { value: "not_analyzed", label: "Nao analisados" },
    { value: "with_transcript", label: "Com transcricao" },
    { value: "without_transcript", label: "Sem transcricao" },
    { value: "linked", label: "Com roteiro" },
    { value: "unlinked", label: "Sem roteiro" },
  ];

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap gap-2">
        {filters.map((item) => (
          <Button
            key={item.value}
            type="button"
            size="sm"
            variant={filter === item.value ? "secondary" : "outline"}
            onClick={() => onFilterChange(item.value)}
          >
            {item.label}
          </Button>
        ))}
      </div>

      <Select value={sort} onValueChange={(value) => onSortChange(value as ShortsSort)}>
        <SelectTrigger className="w-full sm:w-[220px]">
          <SelectValue placeholder="Ordenar" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="recent">Mais recentes</SelectItem>
          <SelectItem value="views">Mais views</SelectItem>
          <SelectItem value="retention">Melhor retencao</SelectItem>
          <SelectItem value="engagement">Mais engajamento</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
