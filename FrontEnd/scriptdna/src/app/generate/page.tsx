"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, PenTool, Wand2, Zap } from "lucide-react";
import { useStyles } from "@/hooks/use-styles";
import {
  useGenerateScript,
  useImproveScript,
  useGenerateHooks,
} from "@/hooks/use-generate";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { generateSchema, type GenerateFormData } from "@/features/generate/schema";
import { ScriptBriefForm } from "@/features/generate/components/ScriptBriefForm";
import { HookGeneratorPanel } from "@/features/generate/components/HookGeneratorPanel";
import { ImproveScriptPanel } from "@/features/generate/components/ImproveScriptPanel";
import { GenerateLoadingState } from "@/features/generate/components/GenerateLoadingState";
import { GenerateIdleState } from "@/features/generate/components/GenerateIdleState";
import { ScriptResultView } from "@/features/generate/components/ScriptResultView";
import { NextStepCard } from "@/features/generate/components/NextStepCard";
import { VariantComparisonPanel } from "@/features/generate/components/VariantComparisonPanel";
import type {
  GeneratedScript,
  GeneratedVariant,
  ImprovedScript,
} from "@/types/api";

function isVariantsResponse(
  data: unknown
): data is { variants: GeneratedVariant[]; recommended_variant: number } {
  return typeof data === "object" && data !== null && "variants" in data;
}

function getErrorMessage(...errors: unknown[]) {
  const error = errors.find(Boolean);
  if (error instanceof Error && error.message) return error.message;
  return "Erro ao gerar. Verifique os parâmetros e tente novamente.";
}

export default function GeneratePage() {
  return (
    <Suspense>
      <GeneratePageContent />
    </Suspense>
  );
}

function GeneratePageContent() {
  const searchParams = useSearchParams();
  const defaultStyleId = searchParams?.get("style") ?? "";
  const defaultTheme = searchParams?.get("theme") ?? "";
  const defaultIdea = searchParams?.get("idea") ?? "";
  const defaultNicheParam = searchParams?.get("niche") ?? "";
  const defaultGoalParam = searchParams?.get("goal") ?? "";

  // Result state
  const [generatedScript, setGeneratedScript] = useState<GeneratedScript | null>(
    null
  );
  const [generatedVariants, setGeneratedVariants] = useState<
    GeneratedVariant[] | null
  >(null);
  const [recommendedVariant, setRecommendedVariant] = useState<number | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [generatedHooks, setGeneratedHooks] = useState<string[] | null>(null);
  const [improvedScript, setImprovedScript] = useState<ImprovedScript | null>(null);

  // Hooks
  const styles = useStyles();
  const generateScript = useGenerateScript();
  const improveScript = useImproveScript();
  const generateHooks = useGenerateHooks();

  // Onboarding prefill
  const { goal, niche } = useOnboardingStore();

  const form = useForm<GenerateFormData>({
    resolver: zodResolver(generateSchema),
    defaultValues: {
      theme: "",
      idea: "",
      duration: 60,
      platform: "youtube_shorts",
      niche: "",
      goal: "retention",
      style_profile_id: "",
      aggressiveness: 5,
      hook_type: "curiosity_gap",
      cta: "",
      variants: 1,
      save: false,
    },
  });

  const { setValue } = form;

  // Pre-fill from onboarding store
  useEffect(() => {
    if (niche) setValue("niche", niche);
    if (goal) setValue("goal", goal);
  }, [niche, goal, setValue]);

  // Pre-fill style from URL param
  useEffect(() => {
    if (defaultStyleId && styles.data?.data) {
      const exists = styles.data.data.some((s) => s.id === defaultStyleId);
      if (exists) setValue("style_profile_id", defaultStyleId);
    }
  }, [defaultStyleId, styles.data?.data, setValue]);

  // Pre-fill from URL params (CTAs from insights/ideas/strategy)
  useEffect(() => {
    if (defaultTheme) setValue("theme", defaultTheme);
    if (defaultIdea) setValue("idea", defaultIdea);
    if (defaultNicheParam) setValue("niche", defaultNicheParam);
    if (defaultGoalParam) setValue("goal", defaultGoalParam as GenerateFormData["goal"]);
  }, [defaultTheme, defaultIdea, defaultNicheParam, defaultGoalParam, setValue]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const onGenerate = async (data: GenerateFormData) => {
    setGeneratedHooks(null);
    setImprovedScript(null);
    setGeneratedVariants(null);
    setGeneratedScript(null);
    setSelectedVariantId(null);

    try {
      const result = await generateScript.mutateAsync({
        ...data,
        style_profile_id: data.style_profile_id ?? "",
        cta: data.cta ?? "",
      });

      if (isVariantsResponse(result.data)) {
        const response = result.data;
        setGeneratedVariants(response.variants);
        setRecommendedVariant(response.recommended_variant);
        const recommended =
          response.variants.find(
            (v) => v.variant_id === response.recommended_variant
          ) ?? response.variants[0];
        setGeneratedScript(recommended);
        setSelectedVariantId(recommended.variant_id);
      } else {
        setGeneratedScript(result.data);
      }
    } catch {
      // error surfaced via isError below
    }
  };

  const onGenerateHooks = async () => {
    const values = form.getValues();
    setGeneratedScript(null);
    setGeneratedVariants(null);
    setImprovedScript(null);

    try {
      const result = await generateHooks.mutateAsync({
        theme: values.theme,
        count: 5,
        style_profile_id: values.style_profile_id,
        hook_type: values.hook_type,
      });
      setGeneratedHooks(result.data.hooks);
    } catch {
      setGeneratedHooks(null);
    }
  };

  const onImprove = async (text: string, styleProfileId?: string) => {
    setGeneratedScript(null);
    setGeneratedVariants(null);
    setGeneratedHooks(null);

    try {
      const result = await improveScript.mutateAsync({
        script_text: text,
        style_profile_id: styleProfileId,
        focus: "retention",
      });
      setImprovedScript(result.data);
    } catch {
      setImprovedScript(null);
    }
  };

  const handleVariantSelect = (variant: GeneratedVariant) => {
    setGeneratedScript(variant);
    setSelectedVariantId(variant.variant_id);
  };

  // ── Derived state ─────────────────────────────────────────────────────────

  const isLoading =
    generateScript.isPending ||
    improveScript.isPending ||
    generateHooks.isPending;
  const hasError =
    generateScript.isError || improveScript.isError || generateHooks.isError;
  const stylesList = styles.data?.data;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gerar Roteiro</h1>
        <p className="text-muted-foreground">
          Crie roteiros otimizados para retenção com IA
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:items-start">
        {/* ── Left: Form area ─────────────────────────────────────────────── */}
        <div className="lg:sticky lg:top-6 space-y-4">
          <Tabs defaultValue="generate">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="generate" disabled={isLoading}>
                <PenTool className="h-4 w-4 mr-1.5" />
                Criar roteiro
              </TabsTrigger>
              <TabsTrigger value="hooks" disabled={isLoading}>
                <Zap className="h-4 w-4 mr-1.5" />
                Criar aberturas
              </TabsTrigger>
              <TabsTrigger value="improve" disabled={isLoading}>
                <Wand2 className="h-4 w-4 mr-1.5" />
                Melhorar
              </TabsTrigger>
            </TabsList>

            <TabsContent value="generate" className="mt-4">
              <div className="rounded-lg border p-5">
                <ScriptBriefForm
                  form={form}
                  styles={stylesList}
                  onSubmit={onGenerate}
                  isPending={generateScript.isPending}
                  isLoading={isLoading}
                />
              </div>
            </TabsContent>

            <TabsContent value="hooks" className="mt-4">
              <HookGeneratorPanel
                form={form}
                styles={stylesList}
                hooks={generatedHooks}
                isPending={generateHooks.isPending}
                isLoading={isLoading}
                onGenerateHooks={onGenerateHooks}
              />
            </TabsContent>

            <TabsContent value="improve" className="mt-4">
              <ImproveScriptPanel
                form={form}
                styles={stylesList}
                improvedScript={improvedScript}
                isPending={improveScript.isPending}
                isLoading={isLoading}
                onImprove={onImprove}
              />
            </TabsContent>
          </Tabs>

          {/* Error feedback */}
          {hasError && (
            <Card className="border-destructive">
              <CardContent className="flex items-center gap-2 py-3 text-destructive text-sm">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {getErrorMessage(
                  generateScript.error,
                  improveScript.error,
                  generateHooks.error
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── Right: Output area ───────────────────────────────────────────── */}
        <div>
          {isLoading ? (
            <GenerateLoadingState />
          ) : generatedVariants ? (
            <div className="space-y-6">
              <VariantComparisonPanel
                variants={generatedVariants}
                recommendedVariant={recommendedVariant ?? undefined}
                selectedVariantId={selectedVariantId}
                onSelect={handleVariantSelect}
              />
              {generatedScript && (
                <>
                  <ScriptResultView script={generatedScript} />
                  <NextStepCard script={generatedScript} />
                </>
              )}
            </div>
          ) : generatedScript ? (
            <div className="space-y-4">
              <ScriptResultView script={generatedScript} />
              <NextStepCard script={generatedScript} />
            </div>
          ) : (
            <GenerateIdleState />
          )}
        </div>
      </div>
    </div>
  );
}
