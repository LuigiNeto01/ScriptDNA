"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Filter, Search } from "lucide-react";

export function LibraryFilterBar({
  searchQuery,
  nicheFilter,
  onSearchChange,
  onNicheChange,
}: {
  searchQuery: string;
  nicheFilter: string;
  onSearchChange: (value: string) => void;
  onNicheChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_240px]">
      <div className="space-y-2">
        <Label htmlFor="search-input" className="sr-only">
          Buscar referencias
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="search-input"
            placeholder="Busque por ideia, gancho, promessa ou estilo..."
            className="pl-10"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            data-testid="search-input"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="niche-filter" className="sr-only">
          Filtrar por nicho
        </Label>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="niche-filter"
            placeholder="Filtrar por nicho"
            className="pl-10"
            value={nicheFilter}
            onChange={(event) => onNicheChange(event.target.value)}
            data-testid="niche-filter"
          />
        </div>
      </div>
    </div>
  );
}
