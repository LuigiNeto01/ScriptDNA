"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Pencil } from "lucide-react";

interface ScriptActionPanelProps {
  canImprove: boolean;
  isImproving: boolean;
  isEditing: boolean;
  onImprove: () => void;
  onToggleEdit: () => void;
}

export function ScriptActionPanel({
  canImprove,
  isImproving,
  isEditing,
  onImprove,
  onToggleEdit,
}: ScriptActionPanelProps) {
  return (
    <Card data-testid="script-action-panel">
      <CardHeader>
        <CardTitle className="text-base">Ações</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start"
          onClick={onToggleEdit}
          data-testid="script-edit-btn"
        >
          <Pencil className="mr-2 h-4 w-4" />
          {isEditing ? "Cancelar edição" : "Editar manualmente"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start"
          onClick={onImprove}
          disabled={isImproving || !canImprove}
          data-testid="script-improve-btn"
        >
          {isImproving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          {isImproving ? "Melhorando..." : "Melhorar com IA"}
        </Button>
        {!canImprove && (
          <p className="text-xs text-muted-foreground px-1">
            Selecione uma versão com linhas para melhorar
          </p>
        )}
      </CardContent>
    </Card>
  );
}
