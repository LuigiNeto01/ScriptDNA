"use client";

import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Check, Loader2, X } from "lucide-react";

interface ScriptEditorProps {
  value: string;
  onChange: (text: string) => void;
  onSave: () => void;
  onCancel: () => void;
  isSaving?: boolean;
}

export function ScriptEditor({
  value,
  onChange,
  onSave,
  onCancel,
  isSaving = false,
}: ScriptEditorProps) {
  return (
    <div className="space-y-4" data-testid="script-editor">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={12}
        className="font-mono text-sm"
        placeholder="Uma linha por vez. Cada linha vira uma parte do roteiro."
        data-testid="script-editor-textarea"
      />
      <div className="flex gap-2">
        <Button
          onClick={onSave}
          disabled={isSaving || !value.trim()}
          data-testid="script-editor-save"
        >
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Check className="mr-2 h-4 w-4" />
          )}
          Salvar nova versão
        </Button>
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isSaving}
          data-testid="script-editor-cancel"
        >
          <X className="mr-2 h-4 w-4" />
          Cancelar
        </Button>
      </div>
    </div>
  );
}
