"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useScript, useScriptVersions, useUpdateScriptStatus, useCreateVersion } from "@/hooks/use-scripts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowLeft, GitBranch, Clock, Check, Pencil, Sparkles } from "lucide-react";
import type { ScriptLine, ScriptStatus, ScriptVersion } from "@/types/api";
import { useImproveScript } from "@/hooks/use-generate";

const STATUS_OPTIONS: { value: ScriptStatus; label: string }[] = [
  { value: "draft", label: "Rascunho" },
  { value: "approved", label: "Aprovado" },
  { value: "published", label: "Publicado" },
  { value: "analyzed", label: "Analisado" },
  { value: "archived", label: "Arquivado" },
];

export default function ScriptDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const script = useScript(id);
  const versions = useScriptVersions(id);
  const updateStatus = useUpdateScriptStatus(id);
  const createVersion = useCreateVersion(id);
  const improveScript = useImproveScript();

  const [selectedVersion, setSelectedVersion] = useState<ScriptVersion | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState("");

  const currentVersion = selectedVersion ?? script.data?.current_version;
  const lines = currentVersion?.lines as ScriptLine[] | null | undefined;

  function handleImprove() {
    if (!lines) return;
    const scriptText = lines.map((l) => l.line).join("\n");
    improveScript.mutate(
      { script_text: scriptText, focus: "retention" },
      {
        onSuccess: (res) => {
          const improved = res.data;
          createVersion.mutate({
            lines: improved.improved_lines,
            analysis: improved.analysis,
            change_summary: `Melhoria IA: ${improved.problems_found?.join(", ") ?? "otimizado"}`,
            created_by: "ai_improvement",
          });
        },
      }
    );
  }

  function handleSaveEdit() {
    const newLines = editText.split("\n").filter(Boolean).map((line, i) => ({
      start: String(i * 3),
      end: String((i + 1) * 3),
      line,
      function: "development",
      retention_note: "",
    }));
    createVersion.mutate(
      { lines: newLines, change_summary: "Edicao manual", created_by: "user" },
      { onSuccess: () => setIsEditing(false) }
    );
  }

  if (script.isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!script.data) {
    return <div className="py-12 text-center text-muted-foreground">Roteiro nao encontrado</div>;
  }

  const s = script.data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/scripts">
            <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{s.title}</h1>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              {s.theme && <span>{s.theme}</span>}
              {s.niche && <><span>&middot;</span><span>{s.niche}</span></>}
              {s.estimated_duration_seconds && (
                <><span>&middot;</span><Clock className="h-3.5 w-3.5" /><span>{s.estimated_duration_seconds}s</span></>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={s.status} onValueChange={(v) => updateStatus.mutate(v as ScriptStatus)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        {/* Main Content */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  Versao {currentVersion?.version_number ?? 1}
                  {currentVersion?.created_by === "ai_generation" && <Badge variant="outline" className="ml-2">IA</Badge>}
                  {currentVersion?.created_by === "ai_improvement" && <Badge variant="outline" className="ml-2">Melhoria IA</Badge>}
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => {
                    setIsEditing(!isEditing);
                    if (!isEditing && lines) {
                      setEditText(lines.map((l) => l.line).join("\n"));
                    }
                  }}>
                    <Pencil className="mr-2 h-4 w-4" />
                    {isEditing ? "Cancelar" : "Editar"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleImprove} disabled={improveScript.isPending || !lines}>
                    {improveScript.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    Melhorar com IA
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={12} className="font-mono text-sm" />
                  <Button onClick={handleSaveEdit} disabled={createVersion.isPending}>
                    {createVersion.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                    Salvar como nova versao
                  </Button>
                </div>
              ) : lines && lines.length > 0 ? (
                <div className="space-y-2">
                  {lines.map((line, i) => (
                    <div key={i} className="flex gap-3 rounded-lg border p-3">
                      <span className="shrink-0 text-xs font-mono text-muted-foreground w-16">{line.start}–{line.end}s</span>
                      <div className="flex-1">
                        <p className="text-sm">{line.line}</p>
                        {line.retention_note && <p className="text-xs text-muted-foreground mt-1">{line.retention_note}</p>}
                      </div>
                      <Badge variant="outline" className="shrink-0 h-fit">{line.function}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground py-8 text-center">Nenhum conteudo nesta versao</p>
              )}

              {/* Analysis */}
              {currentVersion?.analysis && (
                <div className="mt-4 rounded-lg border p-4 space-y-2">
                  <h4 className="font-semibold text-sm">Analise</h4>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>Hook: <strong>{Math.round((currentVersion.analysis.hook_strength as number ?? 0) * 100)}%</strong></div>
                    <div>Gaps: <strong>{(currentVersion.analysis.curiosity_gaps as string[])?.length ?? 0}</strong></div>
                    <div>Fracos: <strong>{(currentVersion.analysis.weak_points as string[])?.length ?? 0}</strong></div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Versions Sidebar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <GitBranch className="h-4 w-4" />
              Versoes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {versions.isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" />
            ) : versions.data?.map((v) => (
              <button
                key={v.id}
                onClick={() => setSelectedVersion(v)}
                className={`w-full text-left rounded-lg border p-3 text-sm transition-colors hover:bg-accent ${
                  currentVersion?.id === v.id ? "border-primary bg-accent" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">v{v.version_number}</span>
                  <span className="text-xs text-muted-foreground">
                    {v.created_by === "user" ? "Manual" : "IA"}
                  </span>
                </div>
                {v.change_summary && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{v.change_summary}</p>
                )}
                <span className="text-xs text-muted-foreground">
                  {new Date(v.created_at).toLocaleDateString("pt-BR")}
                </span>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
