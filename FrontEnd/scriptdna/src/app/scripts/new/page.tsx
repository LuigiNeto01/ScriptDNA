"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useGenerateScript } from "@/hooks/use-generate";
import { useCreateScript } from "@/hooks/use-scripts";
import { useStyles } from "@/hooks/use-styles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Save, ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { GeneratedScript, GenerateScriptResponse, ScriptLine } from "@/types/api";

const HOOK_TYPES = [
  { value: "curiosity_gap", label: "Lacuna de Curiosidade" },
  { value: "bold_claim", label: "Afirmacao Ousada" },
  { value: "question", label: "Pergunta Provocativa" },
  { value: "story", label: "Historia Pessoal" },
  { value: "statistic", label: "Estatistica Chocante" },
  { value: "controversial", label: "Controverso" },
  { value: "pattern_interrupt", label: "Quebra de Padrao" },
];

function firstSliderValue(value: number | readonly number[]) {
  return Array.isArray(value) ? value[0] : value;
}

function pickGeneratedScript(data: GenerateScriptResponse): GeneratedScript {
  if ("variants" in data) {
    return (
      data.variants.find((variant) => variant.variant_id === data.recommended_variant) ??
      data.variants[0]
    );
  }

  return data;
}

export default function NewScriptPage() {
  const router = useRouter();
  const styles = useStyles();
  const generateScript = useGenerateScript();
  const createScript = useCreateScript();

  const [theme, setTheme] = useState("");
  const [idea, setIdea] = useState("");
  const [duration, setDuration] = useState(45);
  const [niche, setNiche] = useState("");
  const [styleId, setStyleId] = useState("");
  const [hookType, setHookType] = useState("curiosity_gap");
  const [aggressiveness, setAggressiveness] = useState(5);
  const [cta, setCta] = useState("");
  const [generated, setGenerated] = useState<GeneratedScript | null>(null);

  async function handleGenerate() {
    generateScript.mutate(
      {
        theme,
        idea: idea || undefined,
        duration,
        niche,
        style_profile_id: styleId || undefined,
        hook_type: hookType,
        aggressiveness,
        cta,
      },
      {
        onSuccess: (res) => {
          setGenerated(pickGeneratedScript(res.data));
        },
      }
    );
  }

  async function handleSave() {
    if (!generated) return;
    createScript.mutate(
      {
        title: theme,
        theme,
        niche: niche || undefined,
        estimated_duration_seconds: duration,
        lines: generated.lines,
        analysis: generated.analysis,
        generation_params: { hook_type: hookType, aggressiveness, cta },
      },
      {
        onSuccess: (res) => {
          router.push(`/scripts/${res.data.script_id}`);
        },
      }
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/scripts">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Novo Roteiro</h1>
          <p className="text-muted-foreground">Gere um roteiro otimizado com IA</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Configuracao</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="theme">Tema / Titulo</Label>
              <Input id="theme" value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="Ex: 5 habitos que destroem sua produtividade" data-testid="script-theme" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="idea">Ideia (opcional)</Label>
              <Textarea id="idea" value={idea} onChange={(e) => setIdea(e.target.value)} placeholder="Descreva sua ideia ou rascunho..." rows={3} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Duracao: {duration}s</Label>
                <Slider value={[duration]} onValueChange={(v) => setDuration(firstSliderValue(v))} min={15} max={60} step={5} />
              </div>
              <div className="space-y-2">
                <Label>Agressividade: {aggressiveness}</Label>
                <Slider value={[aggressiveness]} onValueChange={(v) => setAggressiveness(firstSliderValue(v))} min={1} max={10} step={1} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="niche">Nicho</Label>
                <Input id="niche" value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="Ex: financas, tech" />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Hook</Label>
                <Select value={hookType} onValueChange={(value) => value && setHookType(value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {HOOK_TYPES.map((h) => (
                      <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {styles.data?.data && (
              <div className="space-y-2">
                <Label>Estilo de Referencia</Label>
                <Select value={styleId} onValueChange={(value) => setStyleId(value ?? "")}>
                  <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum</SelectItem>
                    {(styles.data.data as { id: string; name: string }[]).map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="cta">CTA</Label>
              <Input id="cta" value={cta} onChange={(e) => setCta(e.target.value)} placeholder="Ex: Segue pra mais dicas" />
            </div>

            <Button onClick={handleGenerate} disabled={!theme || generateScript.isPending} className="w-full" data-testid="generate-script-btn">
              {generateScript.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Gerar Roteiro
            </Button>
          </CardContent>
        </Card>

        {/* Result */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Roteiro Gerado</CardTitle>
              {generated && (
                <Button onClick={handleSave} disabled={createScript.isPending} size="sm">
                  {createScript.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Salvar
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!generated ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Sparkles className="h-12 w-12 mb-4 opacity-20" />
                <p>Configure e gere seu roteiro</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Lines */}
                <div className="space-y-2">
                  {generated.lines.map((line: ScriptLine, i: number) => (
                    <div key={i} className="flex gap-3 rounded-lg border p-3">
                      <span className="shrink-0 text-xs font-mono text-muted-foreground w-16">
                        {line.start}–{line.end}s
                      </span>
                      <div className="flex-1">
                        <p className="text-sm">{line.line}</p>
                        {line.retention_note && (
                          <p className="text-xs text-muted-foreground mt-1">{line.retention_note}</p>
                        )}
                      </div>
                      <Badge variant="outline" className="shrink-0 h-fit">{line.function}</Badge>
                    </div>
                  ))}
                </div>

                {/* Analysis */}
                {generated.analysis && (
                  <div className="rounded-lg border p-4 space-y-2">
                    <h4 className="font-semibold text-sm">Analise</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Hook: <strong>{Math.round(generated.analysis.hook_strength * 100)}%</strong></div>
                      <div>Gaps: <strong>{generated.analysis.curiosity_gaps?.length ?? 0}</strong></div>
                    </div>
                    {generated.analysis.weak_points?.length > 0 && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Pontos fracos:</span>
                        <ul className="list-disc list-inside text-xs text-muted-foreground mt-1">
                          {generated.analysis.weak_points.map((wp: string, i: number) => (
                            <li key={i}>{wp}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
