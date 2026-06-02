"use client";

import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Wand2 } from "lucide-react";
import { ScriptLineCard } from "./ScriptLineCard";
import { type GenerateFormData } from "../schema";
import type { ImprovedScript, StyleProfile } from "@/types/api";

interface ImproveScriptPanelProps {
  form: UseFormReturn<GenerateFormData>;
  styles?: StyleProfile[];
  improvedScript: ImprovedScript | null;
  isPending: boolean;
  isLoading: boolean;
  onImprove: (text: string, styleProfileId?: string) => void;
}

export function ImproveScriptPanel({
  form,
  styles,
  improvedScript,
  isPending,
  isLoading,
  onImprove,
}: ImproveScriptPanelProps) {
  const [improveText, setImproveText] = useState("");
  const { control, watch } = form;
  const styleProfileId = watch("style_profile_id");

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Melhorar roteiro</CardTitle>
          <CardDescription>
            Cole um roteiro existente e a IA otimiza para melhor retenção.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="improve-text">Seu roteiro atual</Label>
            <Textarea
              id="improve-text"
              rows={8}
              placeholder="Cole o roteiro que deseja melhorar..."
              value={improveText}
              onChange={(e) => setImproveText(e.target.value)}
              data-testid="improve-text-input"
            />
          </div>

          <div className="space-y-2">
            <Label>Perfil de estilo (opcional)</Label>
            <Controller
              control={control}
              name="style_profile_id"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um estilo" />
                  </SelectTrigger>
                  <SelectContent>
                    {styles?.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <Button
            onClick={() => onImprove(improveText, styleProfileId)}
            disabled={!improveText || isLoading}
            className="w-full"
            data-testid="improve-submit-btn"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Wand2 className="h-4 w-4 mr-2" />
            )}
            Melhorar roteiro
          </Button>
        </CardContent>
      </Card>

      {improvedScript && (
        <div className="space-y-4">
          {improvedScript.problems_found?.length > 0 && (
            <div className="rounded-lg border p-4 space-y-2">
              <p className="text-sm font-semibold">Problemas encontrados</p>
              <ul className="space-y-1">
                {improvedScript.problems_found.map((p, i) => (
                  <li key={i} className="text-xs text-muted-foreground">
                    • {p}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="space-y-2">
            <p className="text-sm font-semibold">Roteiro melhorado</p>
            {improvedScript.improved_lines.map((line, i) => (
              <ScriptLineCard key={i} line={line} index={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
