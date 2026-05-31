"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { Separator } from "@/components/ui/separator";
import { useStyle, useDeleteStyle, useUpdateStyle } from "@/hooks/use-styles";
import { useVideos } from "@/hooks/use-videos";
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  PenTool,
  CheckCircle2,
  XCircle,
  Music,
  Type,
  Gauge,
  Trash2,
  Video,
  Plus,
  X,
  Clock,
  Sparkles,
  BookOpen,
  Zap,
  MessageSquareQuote,
} from "lucide-react";

function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null) return "—";
  const min = Math.floor(seconds / 60);
  const sec = Math.round(seconds % 60);
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

function ManageVideos({
  styleId,
  linkedVideos,
  linkedIds,
}: {
  styleId: string;
  linkedVideos: { id: string; title: string }[];
  linkedIds: Set<string>;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const videos = useVideos({ status: "done" });
  const updateStyle = useUpdateStyle();

  const availableVideos = (videos.data?.data ?? []).filter(
    (v) => v.status === "done" && !linkedIds.has(v.id)
  );

  const handleAdd = (videoId: string) => {
    updateStyle.mutate({ id: styleId, add_video_ids: [videoId] });
  };

  const handleRemove = (videoId: string) => {
    updateStyle.mutate({ id: styleId, remove_video_ids: [videoId] });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Video className="h-4 w-4" />
              Vídeos de Referência ({linkedVideos.length})
            </CardTitle>
            <CardDescription className="mt-1">
              Vídeos usados para gerar este perfil de estilo
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdd(!showAdd)}
          >
            {showAdd ? (
              <X className="h-4 w-4 mr-1" />
            ) : (
              <Plus className="h-4 w-4 mr-1" />
            )}
            {showAdd ? "Fechar" : "Adicionar"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current linked videos */}
        {linkedVideos.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {linkedVideos.map((v) => (
              <div
                key={v.id}
                className="inline-flex items-center gap-1.5 rounded-md border bg-secondary/50 px-2.5 py-1.5 text-sm group hover:border-primary/30 transition-colors"
              >
                <Link
                  href={`/videos/${v.id}`}
                  className="hover:underline hover:text-primary transition-colors"
                >
                  {v.title}
                </Link>
                <button
                  type="button"
                  onClick={() => handleRemove(v.id)}
                  disabled={updateStyle.isPending}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all ml-1"
                  aria-label={`Remover ${v.title}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-6 text-center">
            <Video className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              Nenhum vídeo vinculado a este estilo.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Adicione vídeos para melhorar o perfil de estilo.
            </p>
          </div>
        )}

        {/* Add videos panel */}
        <AnimatePresence>
          {showAdd && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <Separator className="mb-4" />
              <div className="space-y-2">
                <span className="text-sm font-medium">
                  Vídeos disponíveis
                </span>
                {videos.isLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : availableVideos.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
                    Todos os vídeos processados já estão vinculados.
                  </p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {availableVideos.map((video) => (
                      <button
                        key={video.id}
                        type="button"
                        onClick={() => handleAdd(video.id)}
                        disabled={updateStyle.isPending}
                        className="flex items-center gap-3 rounded-lg border p-3 text-left hover:border-primary/40 hover:bg-primary/5 transition-all disabled:opacity-50"
                      >
                        <Plus className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium line-clamp-1">
                            {video.title}
                          </span>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            <span>{video.creator_name ?? "Sem criador"}</span>
                            <span>&middot;</span>
                            <span>{video.niche ?? "Sem nicho"}</span>
                            <span className="flex items-center gap-0.5 ml-auto">
                              <Clock className="h-3 w-3" />
                              {formatDuration(video.duration_seconds)}
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

export default function StyleProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const style = useStyle(id);
  const deleteStyle = useDeleteStyle();
  const router = useRouter();

  const handleDelete = () => {
    if (!style.data) return;
    if (confirm(`Tem certeza que deseja apagar "${style.data.name}"?`)) {
      deleteStyle.mutate(style.data.id, {
        onSuccess: () => router.push("/styles"),
      });
    }
  };

  if (style.isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (style.isError || !style.data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-2 text-destructive">
        <AlertCircle className="h-8 w-8" />
        <span>Erro ao carregar perfil de estilo</span>
      </div>
    );
  }

  const s = style.data;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back */}
      <Link
        href="/styles"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para Estilos
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1 min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{s.name}</h1>
          <p className="text-muted-foreground">{s.description}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={deleteStyle.isPending}
            className="text-muted-foreground hover:text-destructive hover:border-destructive"
          >
            {deleteStyle.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Apagar
          </Button>
          <LinkButton href={`/generate?style=${s.id}`}>
            <PenTool className="h-4 w-4 mr-2" />
            Gerar Roteiro
          </LinkButton>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Music className="h-4 w-4 text-primary/70" />
              <span className="text-sm font-medium text-muted-foreground">
                Tom
              </span>
            </div>
            <p className="text-lg font-semibold">{s.tone}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Gauge className="h-4 w-4 text-primary/70" />
              <span className="text-sm font-medium text-muted-foreground">
                Ritmo
              </span>
            </div>
            <p className="text-lg font-semibold">{s.pacing}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Type className="h-4 w-4 text-primary/70" />
              <span className="text-sm font-medium text-muted-foreground">
                Frase Média
              </span>
            </div>
            <p className="text-lg font-semibold">
              {s.avg_sentence_length} palavras
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Linked Videos */}
      <ManageVideos
        styleId={s.id}
        linkedVideos={s.videos ?? []}
        linkedIds={new Set(s.video_ids ?? [])}
      />

      {/* Rules */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Fazer (Do)
            </CardTitle>
            <CardDescription>
              Práticas recomendadas para este estilo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {s.do_rules.map((rule, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-2 text-sm"
                >
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span>{rule}</span>
                </motion.li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              Evitar (Avoid)
            </CardTitle>
            <CardDescription>
              O que não fazer ao usar este estilo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {s.avoid_rules.map((rule, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-2 text-sm"
                >
                  <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                  <span>{rule}</span>
                </motion.li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Patterns */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Padrões Narrativos
          </CardTitle>
          <CardDescription>
            Padrões recorrentes identificados nos vídeos deste estilo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {s.narrative_patterns.map((pattern, i) => (
              <Badge key={i} variant="secondary" className="text-sm py-1 px-3">
                {pattern}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Hooks and CTAs */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              Hooks Comuns
            </CardTitle>
            <CardDescription>
              Aberturas típicas deste estilo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {s.common_hooks.map((hook, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="text-sm border rounded-lg p-3 bg-muted/30 flex items-start gap-2"
                >
                  <MessageSquareQuote className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <span className="italic">{hook}</span>
                </motion.li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-500" />
              CTAs Comuns
            </CardTitle>
            <CardDescription>
              Chamadas para ação frequentes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {s.common_ctas.map((cta, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="text-sm border rounded-lg p-3 bg-muted/30 flex items-start gap-2"
                >
                  <MessageSquareQuote className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <span className="italic">{cta}</span>
                </motion.li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
