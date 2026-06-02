"use client";

import { Button } from "@/components/ui/button";
import { LayoutGrid, List, Upload } from "lucide-react";
import Link from "next/link";

export function LibraryPageHeader({
  viewMode,
  onViewModeChange,
}: {
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Biblioteca de referencias</h1>
        <p className="max-w-2xl text-muted-foreground">
          Guarde roteiros, videos e exemplos que ajudam a IA a entender o que repetir, evitar e adaptar nos proximos Shorts.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Link href="/import">
          <Button>
            <Upload className="h-4 w-4" />
            Nova referencia
          </Button>
        </Link>
        <div className="flex rounded-lg border p-1">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="icon-sm"
            onClick={() => onViewModeChange("grid")}
            aria-label="Visualizacao em grade"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="icon-sm"
            onClick={() => onViewModeChange("list")}
            aria-label="Visualizacao em lista"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
