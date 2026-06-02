"use client";

import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { Controller } from "react-hook-form";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TermTooltip } from "@/components/help/term-tooltip";
import type { StyleProfile } from "@/types/api";
import { hookTypes, aggressivenessLabels, type GenerateFormData } from "../schema";

interface AdvancedOptionsPanelProps {
  form: UseFormReturn<GenerateFormData>;
  styles?: StyleProfile[];
}

export function AdvancedOptionsPanel({ form, styles }: AdvancedOptionsPanelProps) {
  const [open, setOpen] = useState(false);
  const { register, control, watch, formState: { errors } } = form;
  const aggressiveness = watch("aggressiveness");
  const hookTypeValue = watch("hook_type");
  const ideaValue = watch("idea") ?? "";

  return (
    <div className="rounded-lg border">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-4 text-sm font-medium hover:bg-muted/50 transition-colors rounded-lg"
        aria-expanded={open}
        data-testid="advanced-options-toggle"
      >
        <span>Opções avançadas</span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="border-t p-4 space-y-5" data-testid="advanced-options-content">
          {/* Ideia do vídeo */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="gen-idea">
                Ideia do vídeo{" "}
                <span className="text-muted-foreground font-normal">(opcional)</span>
              </Label>
              <span
                className={`text-xs ${
                  ideaValue.length > 1800 ? "text-destructive" : "text-muted-foreground"
                }`}
              >
                {ideaValue.length}/2000
              </span>
            </div>
            <Textarea
              id="gen-idea"
              placeholder="Descreva sua ideia com suas palavras... Ex: Quero mostrar que existe um mod que custa muito caro e testar se ele realmente muda o jogo."
              rows={3}
              {...register("idea")}
              data-testid="gen-idea-input"
            />
            <p className="text-xs text-muted-foreground">
              Escreva o conceito — a IA desenvolve a estrutura narrativa completa.
            </p>
          </div>

          <Separator />

          {/* Tipo de abertura + Perfil de estilo */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="gen-hook" className="flex items-center gap-1">
                Tipo de abertura
                <TermTooltip term="Tipo de abertura" variant="icon-only" side="right">
                  A estratégia usada para capturar atenção nos primeiros 3 segundos do
                  vídeo.
                </TermTooltip>
              </Label>
              <Controller
                control={control}
                name="hook_type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="gen-hook" data-testid="gen-hook-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {hookTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <p className="text-xs text-muted-foreground">
                {hookTypes.find((h) => h.value === hookTypeValue)?.description ?? ""}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gen-style">Perfil de estilo</Label>
              <Controller
                control={control}
                name="style_profile_id"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="gen-style" data-testid="gen-style-select">
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
              {(!styles || styles.length === 0) && (
                <p className="text-xs text-muted-foreground">
                  Você ainda não tem um perfil de estilo. Tudo bem — a IA ainda consegue
                  gerar roteiros, mas perfis ajudam a deixar o texto mais parecido com
                  seu canal.
                </p>
              )}
            </div>
          </div>

          {/* Intensidade do tom */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1">
                Intensidade do tom
                <TermTooltip term="Intensidade do tom" variant="icon-only" side="right">
                  Controla o quão impactante e direto é o texto. 1 = sutil e suave,
                  10 = muito intenso e direto.
                </TermTooltip>
              </Label>
              <Badge
                variant={
                  aggressiveness >= 7
                    ? "destructive"
                    : aggressiveness >= 4
                      ? "secondary"
                      : "outline"
                }
                className="text-xs font-mono"
              >
                {aggressiveness}/10 — {aggressivenessLabels[aggressiveness]}
              </Badge>
            </div>
            <Controller
              control={control}
              name="aggressiveness"
              render={({ field }) => (
                <Slider
                  min={1}
                  max={10}
                  step={1}
                  value={[field.value]}
                  onValueChange={(val) =>
                    field.onChange(Array.isArray(val) ? val[0] : val)
                  }
                  data-testid="gen-aggressiveness-slider"
                />
              )}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Sutil</span>
              <span>Máximo</span>
            </div>
          </div>

          <Separator />

          {/* CTA, Variantes, Plataforma, Salvar */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gen-cta">
                Chamada para ação{" "}
                <span className="text-muted-foreground font-normal">(opcional)</span>
              </Label>
              <Input
                id="gen-cta"
                placeholder="Ex: Se inscreva e ative o sininho"
                {...register("cta")}
                data-testid="gen-cta-input"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="gen-variants" className="flex items-center gap-1">
                  Variantes
                  <TermTooltip term="Variantes" variant="icon-only" side="right">
                    Gera múltiplas versões do roteiro para você comparar e escolher a
                    melhor. 1 = somente uma versão.
                  </TermTooltip>
                </Label>
                <Input
                  id="gen-variants"
                  type="number"
                  min={1}
                  max={5}
                  {...register("variants", { valueAsNumber: true })}
                  data-testid="gen-variants-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gen-platform">Plataforma</Label>
                <Input
                  id="gen-platform"
                  placeholder="youtube_shorts"
                  {...register("platform")}
                />
              </div>
            </div>

            {errors.variants && (
              <p className="text-xs text-destructive">{errors.variants.message}</p>
            )}

            <label className="flex items-center gap-3 rounded-md border p-3 text-sm cursor-pointer hover:bg-muted/50 transition-colors">
              <input type="checkbox" {...register("save")} />
              Salvar automaticamente a variante recomendada
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
