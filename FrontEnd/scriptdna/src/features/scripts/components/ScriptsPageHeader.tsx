"use client";

import { Plus } from "lucide-react";
import { LinkButton } from "@/components/ui/link-button";

export function ScriptsPageHeader() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Meus Roteiros</h1>
        <p className="text-muted-foreground">Gerencie e evolua seus roteiros de Shorts</p>
      </div>
      <LinkButton href="/generate" data-testid="scripts-create-btn">
        <Plus className="mr-2 h-4 w-4" />
        Criar Roteiro
      </LinkButton>
    </div>
  );
}
