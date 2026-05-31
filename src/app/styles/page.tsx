"use client";

import { useState } from "react";
import Link from "next/link";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { EmptyState } from "@/components/ui/empty-state";
import { useVideos } from "@/hooks/use-videos";
import {
  useStyles,
  useGenerateStyle,
  useDeleteStyle,
} from "@/hooks/use-styles";
import type { Video } from "@/types/api";
import {
  Palette,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Video as VideoIcon,
  Sparkles,
  Clock,
  Trash2,
  Music,
  Gauge,
  ArrowRight,
} from "lucide-react";

function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null) return "—";
  const min = Math.floor(seconds / 60);
  const sec = Math.round(seconds % 60);
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

function VideoSelector({
  videos,
  selected,
  onToggle,
}: {
  videos: Video[];
  selected: Set<string>;
  onToggle: (id: string) => void;
}) {
  const doneVideos = videos.filter((v) => v.status === "done");

  if (doneVideos.length === 0) {
    return (
      <EmptyState
        icon={VideoIcon}
        title="Nenhum vídeo processado"
        description="Importe e processe vídeos antes de criar um perfil de estilo."
      />
    );
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {doneVideos.map((video) => {
        const isSelected = selected.has(video.id);
        return (
          <motion.button
            key={video.id}
            type="button"
            onClick={() => onToggle(video.id)}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative flex items-start gap-3 rounded-lg border p-3 text-left transition-all ${
              isSelected
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "border-border hover:border-primary/40"
            }`}
          >
            <div
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                isSelected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-muted-foreground/30"
              }`}
            >
              {isSelected && <CheckCircle2 className="h-3.5 w-3.5" />}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium line-clamp-1">
                {video.title}
              </span>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <span>{video.creator_name ?? "Sem criador"}</span>
                <span>&middot;</span>
                <Badge variant="outline" className="text-xs py-0">
                  {video.niche ?? "Sem nicho"}
                </Badge>
                <span className="flex items-center gap-0.5 ml-auto">
                  <Clock className="h-3 w-3" />
                  {formatDuration(video.duration_seconds)}
                </span>
              </div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}

function CreateStyleForm() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [styleName, setStyleName] = useState("");
  const [success, setSuccess] = useState(false);

  const videos = useVideos({ status: "done" });
  const generateStyle = useGenerateStyle();

  const toggleVideo = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (selectedIds.size < 1 || !styleName.trim()) return;
    await generateStyle.mutateAsync({
      video_ids: Array.from(selectedIds),
      name: styleName.trim(),
    });
    setSuccess(true);
    setSelectedIds(new Set());
    setStyleName("");
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Criar Perfil de Estilo
        </CardTitle>
        <CardDescription>
          Selecione vídeos processados para extrair um perfil de estilo com IA
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="style-name">Nome do Estilo</Label>
          <Input
            id="style-name"
            placeholder="Ex: Estilo Finanças, Tom Casual, Narrativo Épico..."
            value={styleName}
            onChange={(e) => setStyleName(e.target.value)}
            data-testid="style-name-input"
          />
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Vídeos de Referência</Label>
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {selectedIds.size} selecionado
                  {selectedIds.size !== 1 ? "s" : ""}
                </Badge>
                <button
                  type="button"
                  onClick={() => setSelectedIds(new Set())}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors underline"
                >
                  Limpar
                </button>
              </div>
            )}
          </div>

          {videos.isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : videos.isError ? (
            <div className="flex items-center gap-2 text-destructive py-4">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm">Erro ao carregar vídeos</span>
            </div>
          ) : (
            <VideoSelector
              videos={videos.data?.data ?? []}
              selected={selectedIds}
              onToggle={toggleVideo}
            />
          )}
        </div>

        <Separator />

        <Button
          onClick={handleSubmit}
          disabled={
            selectedIds.size < 1 ||
            !styleName.trim() ||
            generateStyle.isPending
          }
          className="w-full"
          data-testid="generate-style-btn"
        >
          {generateStyle.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Sparkles className="h-4 w-4 mr-2" />
          )}
          {generateStyle.isPending
            ? "Gerando estilo..."
            : `Gerar Estilo a partir de ${selectedIds.size || "..."} vídeo${selectedIds.size !== 1 ? "s" : ""}`}
        </Button>

        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="rounded-lg border border-green-500/30 bg-green-500/5 p-4"
            >
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">
                  Perfil de estilo criado com sucesso!
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {generateStyle.isError && (
          <div className="flex items-center gap-2 text-destructive text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>Erro ao gerar estilo. Tente novamente.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StyleList() {
  const styles = useStyles();
  const deleteStyle = useDeleteStyle();

  if (styles.isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (styles.isError) {
    return (
      <div className="flex items-center gap-2 text-destructive py-4 justify-center">
        <AlertCircle className="h-5 w-5" />
        <span>Erro ao carregar estilos</span>
      </div>
    );
  }

  const data = styles.data?.data;

  if (!data?.length) {
    return (
      <EmptyState
        icon={Palette}
        title="Nenhum estilo criado"
        description="Crie seu primeiro perfil de estilo selecionando vídeos acima."
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((style, i) => (
        <motion.div
          key={style.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <Card className="hover:border-primary/50 transition-colors h-full group">
            <Link href={`/styles/${style.id}`} className="block">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base line-clamp-1">
                      {style.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 mt-1">
                      {style.description}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (
                        confirm(
                          `Tem certeza que deseja apagar "${style.name}"?`
                        )
                      ) {
                        deleteStyle.mutate(style.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Tone & Pacing */}
                <div className="flex items-center gap-3 text-sm">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Music className="h-3.5 w-3.5" />
                    {style.tone}
                  </span>
                  <span className="text-muted-foreground/30">|</span>
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Gauge className="h-3.5 w-3.5" />
                    {style.pacing}
                  </span>
                </div>

                {/* Patterns */}
                <div className="flex flex-wrap gap-1.5">
                  {style.narrative_patterns.slice(0, 3).map((p, j) => (
                    <Badge key={j} variant="outline" className="text-xs">
                      {p}
                    </Badge>
                  ))}
                  {style.narrative_patterns.length > 3 && (
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      +{style.narrative_patterns.length - 3}
                    </Badge>
                  )}
                </div>

                {/* Videos count + CTA hint */}
                <div className="flex items-center justify-between pt-1">
                  {style.videos?.length > 0 ? (
                    <span className="text-xs text-muted-foreground">
                      <VideoIcon className="h-3 w-3 inline mr-1" />
                      {style.videos.length} vídeo
                      {style.videos.length !== 1 ? "s" : ""}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Sem vídeos vinculados
                    </span>
                  )}
                  <span className="text-xs text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    Ver detalhes
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </CardContent>
            </Link>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

export default function StylesPage() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Estilos</h1>
        <p className="text-muted-foreground">
          Crie e gerencie perfis de estilo a partir dos seus vídeos
        </p>
      </div>

      <CreateStyleForm />

      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">
          Perfis Criados
        </h2>
        <StyleList />
      </div>
    </div>
  );
}
