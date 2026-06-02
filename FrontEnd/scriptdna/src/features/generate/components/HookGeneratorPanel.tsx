"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { UseFormReturn } from "react-hook-form";
import { Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { CheckCircle2, Copy, Loader2, Zap } from "lucide-react";
import { copyText } from "../utils/generate-copy";
import { hookTypes, type GenerateFormData } from "../schema";
import type { StyleProfile } from "@/types/api";

interface HookCardProps {
  hook: string;
  index: number;
}

function HookCard({ hook, index }: HookCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await copyText(hook);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-lg border p-4 flex items-start gap-3"
      data-testid="generated-hook"
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
        {index + 1}
      </span>
      <div className="flex-1 space-y-2">
        <p className="text-sm leading-relaxed">{hook}</p>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-xs"
          onClick={handleCopy}
        >
          {copied ? (
            <>
              <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />
              Copiado!
            </>
          ) : (
            <>
              <Copy className="h-3 w-3 mr-1" />
              Copiar
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}

interface HookGeneratorPanelProps {
  form: UseFormReturn<GenerateFormData>;
  styles?: StyleProfile[];
  hooks: string[] | null;
  isPending: boolean;
  isLoading: boolean;
  onGenerateHooks: () => void;
}

export function HookGeneratorPanel({
  form,
  styles,
  hooks,
  isPending,
  isLoading,
  onGenerateHooks,
}: HookGeneratorPanelProps) {
  const {
    register,
    control,
    watch,
    formState: { errors },
  } = form;
  const theme = watch("theme");

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Criar aberturas</CardTitle>
          <CardDescription>
            Gere 5 opções de abertura para testar qual prende mais atenção.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="hooks-theme">Tema do vídeo</Label>
            <Input
              id="hooks-theme"
              placeholder="Ex: 5 hábitos que mudaram minha produtividade"
              {...register("theme")}
            />
            {errors.theme && (
              <p className="text-xs text-destructive">{errors.theme.message}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Tipo de abertura</Label>
              <Controller
                control={control}
                name="hook_type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
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
            </div>
            <div className="space-y-2">
              <Label>Perfil de estilo</Label>
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
          </div>

          <Button
            onClick={onGenerateHooks}
            disabled={isLoading || !theme}
            className="w-full"
            data-testid="gen-hooks-btn"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Zap className="h-4 w-4 mr-2" />
            )}
            Criar 5 aberturas
          </Button>
        </CardContent>
      </Card>

      {hooks && hooks.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Aberturas geradas</h3>
          <div className="space-y-2">
            {hooks.map((hook, i) => (
              <HookCard key={i} hook={hook} index={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
