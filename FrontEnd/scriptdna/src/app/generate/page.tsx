"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStyles } from "@/hooks/use-styles";
import {
  useGenerateScript,
  useImproveScript,
  useGenerateHooks,
} from "@/hooks/use-generate";
import type { GeneratedScript, GeneratedVariant, GenerateScriptResponse } from "@/types/api";
import { VariantComparison } from "@/components/ai/variant-comparison";
import {
  PenTool,
  Wand2,
  Zap,
  Copy,
  Download,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Target,
  MessageCircleQuestion,
  Lightbulb,
  GitCompare,
  ShieldCheck,
} from "lucide-react";

const generateSchema = z.object({
  theme: z.string().min(1, "Tema obrigatório"),
  idea: z.string().max(2000).optional(),
  duration: z.number().min(15).max(600),
  platform: z.string().optional(),
  niche: z.string().min(1, "Nicho obrigatório"),
  goal: z.string().optional(),
  style_profile_id: z.string().optional(),
  aggressiveness: z.number().min(1).max(10),
  hook_type: z.string().min(1, "Tipo de hook obrigatório"),
  cta: z.string().optional(),
  variants: z.number().min(1).max(5),
  save: z.boolean(),
});

type GenerateFormData = z.infer<typeof generateSchema>;

const hookTypes: { value: string; label: string; description: string }[] = [
  {
    value: "curiosity_gap",
    label: "Lacuna de Curiosidade",
    description: "Cria uma pergunta que o espectador precisa responder",
  },
  {
    value: "pattern_interrupt",
    label: "Quebra de Padrão",
    description: "Surpreende com algo inesperado nos primeiros segundos",
  },
  {
    value: "bold_claim",
    label: "Afirmação Ousada",
    description: "Abre com uma declaração forte e provocativa",
  },
  {
    value: "question",
    label: "Pergunta Direta",
    description: "Faz uma pergunta que ressoa com o público",
  },
  {
    value: "story",
    label: "Mini-história",
    description: "Começa com um trecho narrativo envolvente",
  },
  {
    value: "statistic",
    label: "Dado Chocante",
    description: "Abre com um número ou estatística impactante",
  },
  {
    value: "controversial",
    label: "Opinião Controversa",
    description: "Desafia o senso comum para gerar engajamento",
  },
];

const aggressivenessLabels: Record<number, string> = {
  1: "Sutil",
  2: "Leve",
  3: "Moderado",
  4: "Moderado",
  5: "Equilibrado",
  6: "Direto",
  7: "Intenso",
  8: "Agressivo",
  9: "Muito agressivo",
  10: "Máximo",
};

function ScriptOutput({ script }: { script: GeneratedScript }) {
  const [copied, setCopied] = useState(false);

  const fullText = script.lines
    .map((l) => `[${l.start}-${l.end}] ${l.line}`)
    .join("\n");

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    const blob = new Blob([fullText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "roteiro-scriptdna.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const hookStrength = Math.round(script.analysis.hook_strength * 100);
  const hookColor =
    hookStrength >= 70
      ? "text-green-500"
      : hookStrength >= 40
        ? "text-yellow-500"
        : "text-red-500";
  const hookBarColor =
    hookStrength >= 70
      ? "bg-green-500"
      : hookStrength >= 40
        ? "bg-yellow-500"
        : "bg-red-500";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Script Lines */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Roteiro Gerado</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? (
                  <CheckCircle2 className="h-4 w-4 mr-1 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4 mr-1" />
                )}
                {copied ? "Copiado!" : "Copiar"}
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-1" />
                .txt
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-3 pr-4">
              {script.lines.map((line, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="rounded-lg border p-3 space-y-1"
                  data-testid="script-line"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-muted-foreground">
                      {line.start} - {line.end}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {line.function}
                    </Badge>
                  </div>
                  <p className="text-sm leading-relaxed">{line.line}</p>
                  {line.retention_note && (
                    <p className="text-xs text-muted-foreground italic border-l-2 border-muted pl-2 mt-1">
                      {line.retention_note}
                    </p>
                  )}
                  {line.viewer_question && (
                    <p className="text-xs text-primary/80">
                      Pergunta do espectador: {line.viewer_question}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Análise do Roteiro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Zap className={`h-5 w-5 ${hookColor}`} />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">Força do Hook</span>
                <span className={`text-sm font-bold ${hookColor}`}>
                  {hookStrength}%
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${hookStrength}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className={`h-full ${hookBarColor} rounded-full`}
                />
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-2">
              <MessageCircleQuestion className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Curiosity Gaps</span>
            </div>
            {script.analysis.curiosity_gaps.length > 0 ? (
              <ul className="space-y-1">
                {script.analysis.curiosity_gaps.map((gap, i) => (
                  <li key={i} className="text-xs text-muted-foreground">
                    &bull; {gap}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">
                Nenhum curiosity gap detectado
              </p>
            )}
          </div>

          {script.analysis.weak_points.length > 0 && (
            <>
              <Separator />
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium">
                    Pontos de Atenção
                  </span>
                </div>
                <ul className="space-y-1">
                  {script.analysis.weak_points.map((point, i) => (
                    <li key={i} className="text-xs text-muted-foreground">
                      &bull; {point}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {script.quality_evaluation && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">
                    Avaliacao de Qualidade
                  </span>
                  <Badge variant="outline">
                    {Math.round(script.quality_evaluation.quality_score * 100)}%
                  </Badge>
                </div>
                <div className="grid gap-2 sm:grid-cols-5">
                  {Object.entries(script.quality_evaluation.scores).map(
                    ([key, value]) => (
                      <div key={key} className="rounded-md border p-2">
                        <p className="text-[11px] uppercase text-muted-foreground">
                          {key}
                        </p>
                        <p className="text-sm font-semibold">
                          {Math.round((value ?? 0) * 100)}%
                        </p>
                      </div>
                    )
                  )}
                </div>
                {(script.quality_evaluation.fix_suggestions?.length ?? 0) > 0 && (
                  <ul className="space-y-1">
                    {script.quality_evaluation.fix_suggestions?.map(
                      (suggestion, i) => (
                        <li key={i} className="text-xs text-muted-foreground">
                          &bull; {suggestion}
                        </li>
                      )
                    )}
                  </ul>
                )}
              </div>
            </>
          )}

          {(script.evidence_used?.length ||
            script.patterns_applied?.length ||
            script.patterns_avoided?.length ||
            script.predicted_retention_risks?.length ||
            script.improvement_suggestions?.length) && (
            <>
              <Separator />
              <div className="grid gap-3 sm:grid-cols-2">
                <ArrayList title="Evidencias usadas" items={script.evidence_used} />
                <ArrayList title="Padroes aplicados" items={script.patterns_applied} />
                <ArrayList title="Padroes evitados" items={script.patterns_avoided} />
                <ArrayList title="Riscos de retencao" items={script.predicted_retention_risks} />
                <ArrayList title="Melhorias sugeridas" items={script.improvement_suggestions} />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ArrayList({
  title,
  items,
}: {
  title: string;
  items?: string[] | null;
}) {
  if (!items?.length) return null;

  return (
    <div className="rounded-md border p-3">
      <p className="mb-2 text-xs font-medium">{title}</p>
      <ul className="space-y-1">
        {items.slice(0, 4).map((item, i) => (
          <li key={i} className="text-xs text-muted-foreground">
            &bull; {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function HooksOutput({ hooks }: { hooks: string[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hooks Gerados</CardTitle>
          <CardDescription>
            Escolha o que mais se encaixa no seu vídeo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {hooks.map((hook, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-lg border p-3 text-sm flex items-start gap-3"
                data-testid="generated-hook"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {i + 1}
                </span>
                <span className="leading-relaxed pt-0.5">{hook}</span>
              </motion.li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function getErrorMessage(...errors: unknown[]) {
  const error = errors.find(Boolean);
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Erro ao gerar. Verifique os parÃ¢metros e tente novamente.";
}

function isVariantsResponse(
  data: GenerateScriptResponse
): data is { variants: GeneratedVariant[]; recommended_variant: number } {
  return "variants" in data;
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

  const [generatedScript, setGeneratedScript] =
    useState<GeneratedScript | null>(null);
  const [generatedVariants, setGeneratedVariants] = useState<GeneratedVariant[] | null>(null);
  const [recommendedVariant, setRecommendedVariant] = useState<number | null>(null);
  const [generatedHooks, setGeneratedHooks] = useState<string[] | null>(null);
  const [improveText, setImproveText] = useState("");

  const styles = useStyles();
  const generateScript = useGenerateScript();
  const improveScript = useImproveScript();
  const generateHooks = useGenerateHooks();

  const {
    register,
    handleSubmit,
    control,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<GenerateFormData>({
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

  const stylesLoaded = !!styles.data?.data;
  useEffect(() => {
    if (defaultStyleId && stylesLoaded) {
      const exists = styles.data?.data?.some((s) => s.id === defaultStyleId);
      if (exists) {
        setValue("style_profile_id", defaultStyleId);
      }
    }
  }, [defaultStyleId, stylesLoaded, styles.data?.data, setValue]);

  const aggressiveness = useWatch({ control, name: "aggressiveness" });
  const ideaValue = useWatch({ control, name: "idea" }) ?? "";
  const hookTypeValue = useWatch({ control, name: "hook_type" });

  const onGenerate = async (data: GenerateFormData) => {
    setGeneratedHooks(null);
    setGeneratedVariants(null);
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
        setGeneratedScript(
          response.variants.find((v) => v.variant_id === response.recommended_variant) ??
            response.variants[0]
        );
      } else {
        setGeneratedScript(result.data);
      }
    } catch {
      setGeneratedScript(null);
    }
  };

  const onImprove = async () => {
    if (!improveText) return;
    setGeneratedHooks(null);
    try {
      const result = await improveScript.mutateAsync({
        script_text: improveText,
        style_profile_id: getValues("style_profile_id"),
        focus: "retention",
      });
      setGeneratedScript({
        lines: result.data.improved_lines,
        analysis: result.data.analysis,
      });
    } catch {
      setGeneratedScript(null);
    }
  };

  const onGenerateHooks = async () => {
    setGeneratedScript(null);
    const values = getValues();
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

  const isLoading =
    generateScript.isPending ||
    improveScript.isPending ||
    generateHooks.isPending;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gerar Roteiro</h1>
        <p className="text-muted-foreground">
          Crie roteiros otimizados para retenção com IA
        </p>
      </div>

      <Tabs defaultValue="generate">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="generate" disabled={isLoading}>
            <PenTool className="h-4 w-4 mr-2" />
            Novo Roteiro
          </TabsTrigger>
          <TabsTrigger value="hooks" disabled={isLoading}>
            <Zap className="h-4 w-4 mr-2" />
            Gerar Hooks
          </TabsTrigger>
          <TabsTrigger value="improve" disabled={isLoading}>
            <Wand2 className="h-4 w-4 mr-2" />
            Melhorar Roteiro
          </TabsTrigger>
        </TabsList>

        {/* ====== TAB: Novo Roteiro ====== */}
        <TabsContent value="generate" className="mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuração</CardTitle>
              <CardDescription>
                Defina os parâmetros do roteiro
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleSubmit(onGenerate)}
                className="space-y-6"
              >
                {/* --- Bloco: Conteúdo --- */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Lightbulb className="h-4 w-4" />
                    Conteúdo
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gen-theme">Tema / Título</Label>
                    <Input
                      id="gen-theme"
                      placeholder="Ex: 5 hábitos que mudaram minha produtividade"
                      {...register("theme")}
                      data-testid="gen-theme-input"
                    />
                    {errors.theme && (
                      <p className="text-xs text-destructive">
                        {errors.theme.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="gen-idea">
                        Ideia do Vídeo{" "}
                        <span className="text-muted-foreground font-normal">
                          (opcional)
                        </span>
                      </Label>
                      <span
                        className={`text-xs ${ideaValue.length > 1800 ? "text-destructive" : "text-muted-foreground"}`}
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
                      Escreva o conceito — a IA desenvolve a estrutura narrativa
                      completa.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="gen-duration">Duração (segundos)</Label>
                      <Input
                        id="gen-duration"
                        type="number"
                        min={15}
                        max={600}
                        {...register("duration", { valueAsNumber: true })}
                        data-testid="gen-duration-input"
                      />
                      {errors.duration && (
                        <p className="text-xs text-destructive">
                          {errors.duration.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gen-niche">Nicho</Label>
                      <Input
                        id="gen-niche"
                        placeholder="Ex: Produtividade"
                        {...register("niche")}
                        data-testid="gen-niche-input"
                      />
                      {errors.niche && (
                        <p className="text-xs text-destructive">
                          {errors.niche.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* --- Bloco: Estilo & Tom --- */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Target className="h-4 w-4" />
                    Estilo & Tom
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="gen-style">Perfil de Estilo</Label>
                      <Controller
                        control={control}
                        name="style_profile_id"
                        render={({ field }) => (
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger
                              id="gen-style"
                              data-testid="gen-style-select"
                            >
                              <SelectValue placeholder="Selecione um estilo" />
                            </SelectTrigger>
                            <SelectContent>
                              {styles.data?.data?.map((s) => (
                                <SelectItem key={s.id} value={s.id}>
                                  {s.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gen-hook">Tipo de Hook</Label>
                      <Controller
                        control={control}
                        name="hook_type"
                        render={({ field }) => (
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger
                              id="gen-hook"
                              data-testid="gen-hook-select"
                            >
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
                        {hookTypes.find((h) => h.value === hookTypeValue)
                          ?.description ?? ""}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Agressividade</Label>
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
                        {aggressiveness}/10 —{" "}
                        {aggressivenessLabels[aggressiveness]}
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
                            field.onChange(
                              Array.isArray(val) ? val[0] : val
                            )
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

                  <div className="space-y-2">
                    <Label htmlFor="gen-cta">
                      CTA{" "}
                      <span className="text-muted-foreground font-normal">
                        (opcional)
                      </span>
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
                      <Label htmlFor="gen-goal">Objetivo</Label>
                      <Input
                        id="gen-goal"
                        placeholder="retencao, views, inscritos"
                        {...register("goal")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gen-variants">Variantes</Label>
                      <Input
                        id="gen-variants"
                        type="number"
                        min={1}
                        max={5}
                        {...register("variants", { valueAsNumber: true })}
                        data-testid="gen-variants-input"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-3 rounded-md border p-3 text-sm">
                    <input type="checkbox" {...register("save")} />
                    Salvar automaticamente a variante recomendada
                  </label>
                </div>

                <Separator />

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full"
                  data-testid="gen-submit-btn"
                >
                  {generateScript.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <PenTool className="h-4 w-4 mr-2" />
                  )}
                  Gerar Roteiro
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ====== TAB: Gerar Hooks ====== */}
        <TabsContent value="hooks" className="mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gerar Hooks</CardTitle>
              <CardDescription>
                Crie 5 opções de hook para o seu vídeo usando o tema e estilo
                configurados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hooks-theme">Tema</Label>
                <Input
                  id="hooks-theme"
                  placeholder="Ex: 5 hábitos que mudaram minha produtividade"
                  {...register("theme")}
                />
                {errors.theme && (
                  <p className="text-xs text-destructive">
                    {errors.theme.message}
                  </p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Perfil de Estilo</Label>
                  <Controller
                    control={control}
                    name="style_profile_id"
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um estilo" />
                        </SelectTrigger>
                        <SelectContent>
                          {styles.data?.data?.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Hook</Label>
                  <Controller
                    control={control}
                    name="hook_type"
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
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
              </div>

              <Button
                onClick={onGenerateHooks}
                disabled={isLoading || !getValues("theme")}
                className="w-full"
                data-testid="gen-hooks-btn"
              >
                {generateHooks.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Zap className="h-4 w-4 mr-2" />
                )}
                Gerar 5 Hooks
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ====== TAB: Melhorar Roteiro ====== */}
        <TabsContent value="improve" className="mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Melhorar Roteiro</CardTitle>
              <CardDescription>
                Cole um roteiro existente e a IA otimiza para melhor retenção
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
                <Label>Perfil de Estilo (opcional)</Label>
                <Controller
                  control={control}
                  name="style_profile_id"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um estilo" />
                      </SelectTrigger>
                      <SelectContent>
                        {styles.data?.data?.map((s) => (
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
                onClick={onImprove}
                disabled={!improveText || improveScript.isPending}
                className="w-full"
                data-testid="improve-submit-btn"
              >
                {improveScript.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Wand2 className="h-4 w-4 mr-2" />
                )}
                Melhorar Roteiro
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Output */}
      <AnimatePresence>
        {generatedVariants && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2">
              <GitCompare className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">
                Comparacao de variantes
              </h2>
            </div>
            <VariantComparison
              variants={generatedVariants}
              recommendedVariant={recommendedVariant ?? undefined}
              onSelect={(variant) => setGeneratedScript(variant)}
            />
          </motion.div>
        )}
        {generatedScript && <ScriptOutput script={generatedScript} />}
        {generatedHooks && <HooksOutput hooks={generatedHooks} />}
      </AnimatePresence>

      {/* Error */}
      {(generateScript.isError ||
        improveScript.isError ||
        generateHooks.isError) && (
        <Card className="border-destructive">
          <CardContent className="flex items-center gap-2 py-4 text-destructive">
            <Target className="h-5 w-5" />
            <span>
              {getErrorMessage(
                generateScript.error,
                improveScript.error,
                generateHooks.error
              )}
            </span>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
