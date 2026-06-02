"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, User, Link2, Unlink } from "lucide-react";
import type { ScriptStatus } from "@/types/api";

export type OriginFilter = "all" | "ai" | "manual";
export type LinkedFilter = "all" | "linked" | "unlinked";

interface ScriptsFilterBarProps {
  statusFilter: ScriptStatus | "all";
  onStatusChange: (v: ScriptStatus | "all") => void;
  nicheFilter: string;
  onNicheChange: (v: string) => void;
  originFilter: OriginFilter;
  onOriginChange: (v: OriginFilter) => void;
  linkedFilter: LinkedFilter;
  onLinkedChange: (v: LinkedFilter) => void;
}

export function ScriptsFilterBar({
  statusFilter,
  onStatusChange,
  nicheFilter,
  onNicheChange,
  originFilter,
  onOriginChange,
  linkedFilter,
  onLinkedChange,
}: ScriptsFilterBarProps) {
  return (
    <div className="flex flex-wrap gap-2 items-center">
      {/* Status */}
      <Select
        value={statusFilter}
        onValueChange={(v) => onStatusChange(v as ScriptStatus | "all")}
      >
        <SelectTrigger className="w-[160px]" data-testid="scripts-status-filter">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os status</SelectItem>
          <SelectItem value="draft">Rascunho</SelectItem>
          <SelectItem value="approved">Aprovado</SelectItem>
          <SelectItem value="published">Publicado</SelectItem>
          <SelectItem value="analyzed">Analisado</SelectItem>
          <SelectItem value="archived">Arquivado</SelectItem>
        </SelectContent>
      </Select>

      {/* Niche */}
      <Input
        placeholder="Filtrar por nicho"
        value={nicheFilter}
        onChange={(e) => onNicheChange(e.target.value)}
        className="w-[180px]"
        data-testid="scripts-niche-filter"
      />

      {/* Origin */}
      <div className="flex gap-1 rounded-md border p-1">
        <Button
          variant={originFilter === "all" ? "default" : "ghost"}
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => onOriginChange("all")}
          data-testid="scripts-origin-all"
        >
          Todos
        </Button>
        <Button
          variant={originFilter === "ai" ? "default" : "ghost"}
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => onOriginChange("ai")}
          data-testid="scripts-origin-ai"
        >
          <Sparkles className="mr-1 h-3 w-3" />
          IA
        </Button>
        <Button
          variant={originFilter === "manual" ? "default" : "ghost"}
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => onOriginChange("manual")}
          data-testid="scripts-origin-manual"
        >
          <User className="mr-1 h-3 w-3" />
          Manual
        </Button>
      </div>

      {/* Linked video */}
      <div className="flex gap-1 rounded-md border p-1">
        <Button
          variant={linkedFilter === "all" ? "default" : "ghost"}
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => onLinkedChange("all")}
          data-testid="scripts-linked-all"
        >
          Todos
        </Button>
        <Button
          variant={linkedFilter === "linked" ? "default" : "ghost"}
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => onLinkedChange("linked")}
          data-testid="scripts-linked-yes"
        >
          <Link2 className="mr-1 h-3 w-3" />
          Com Short
        </Button>
        <Button
          variant={linkedFilter === "unlinked" ? "default" : "ghost"}
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => onLinkedChange("unlinked")}
          data-testid="scripts-linked-no"
        >
          <Unlink className="mr-1 h-3 w-3" />
          Sem Short
        </Button>
      </div>
    </div>
  );
}
