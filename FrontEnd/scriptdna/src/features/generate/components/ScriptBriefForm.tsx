"use client";

import type { UseFormReturn, SubmitHandler } from "react-hook-form";
import { Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, PenTool } from "lucide-react";
import { GOAL_OPTIONS } from "@/stores/onboarding-store";
import type { StyleProfile } from "@/types/api";
import { DURATION_PRESETS, type GenerateFormData } from "../schema";
import { AdvancedOptionsPanel } from "./AdvancedOptionsPanel";

interface ScriptBriefFormProps {
  form: UseFormReturn<GenerateFormData>;
  styles?: StyleProfile[];
  onSubmit: SubmitHandler<GenerateFormData>;
  isPending: boolean;
  isLoading: boolean;
}

export function ScriptBriefForm({
  form,
  styles,
  onSubmit,
  isPending,
  isLoading,
}: ScriptBriefFormProps) {
  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const duration = watch("duration");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Tema */}
      <div className="space-y-2">
        <Label htmlFor="gen-theme">Tema do roteiro</Label>
        <Input
          id="gen-theme"
          placeholder="Ex: Coloquei duas IAs para competir no Minecraft"
          {...register("theme")}
          data-testid="gen-theme-input"
        />
        {errors.theme && (
          <p className="text-xs text-destructive">{errors.theme.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Seja específico — temas concretos geram roteiros mais envolventes.
        </p>
      </div>

      {/* Nicho */}
      <div className="space-y-2">
        <Label htmlFor="gen-niche">Nicho</Label>
        <Input
          id="gen-niche"
          placeholder="Ex: Minecraft, IA, produtividade, finanças..."
          {...register("niche")}
          data-testid="gen-niche-input"
        />
        {errors.niche && (
          <p className="text-xs text-destructive">{errors.niche.message}</p>
        )}
      </div>

      {/* Duração + Objetivo */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="gen-duration">Duração</Label>
          <Input
            id="gen-duration"
            type="number"
            min={15}
            max={600}
            placeholder="Segundos"
            {...register("duration", { valueAsNumber: true })}
            data-testid="gen-duration-input"
          />
          {errors.duration && (
            <p className="text-xs text-destructive">{errors.duration.message}</p>
          )}
          {/* Presets */}
          <div className="flex flex-wrap gap-1.5">
            {DURATION_PRESETS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => setValue("duration", preset.value)}
                className={`rounded px-2 py-0.5 text-xs border transition-colors ${
                  duration === preset.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="gen-goal">Objetivo principal</Label>
          <Controller
            control={control}
            name="goal"
            render={({ field }) => (
              <Select
                value={field.value ?? ""}
                onValueChange={field.onChange}
              >
                <SelectTrigger id="gen-goal" data-testid="gen-goal-select">
                  <SelectValue placeholder="O que quer otimizar?" />
                </SelectTrigger>
                <SelectContent>
                  {GOAL_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <p className="text-xs text-muted-foreground">
            O que você quer otimizar neste vídeo?
          </p>
        </div>
      </div>

      <Separator />

      {/* Opções avançadas (colapsado por padrão) */}
      <AdvancedOptionsPanel form={form} styles={styles} />

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full"
        data-testid="gen-submit-btn"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <PenTool className="h-4 w-4 mr-2" />
        )}
        Gerar Roteiro
      </Button>
    </form>
  );
}
