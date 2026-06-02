"use client";

import { useState } from "react";
import { useStyles, useGenerateStyle, useDeleteStyle } from "@/hooks/use-styles";
import { useVideos } from "@/hooks/use-videos";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EducationalEmptyState } from "@/components/feedback/educational-empty-state";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Palette,
  Plus,
  Loader2,
  AlertCircle,
  Trash2,
  Lock,
  Globe,
  Video,
  Mic,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import type { StyleProfile } from "@/types/api";

export default function StylesPage() {
  const styles = useStyles();
  const generateStyle = useGenerateStyle();
  const deleteStyle = useDeleteStyle();

  const profileList = (styles.data as { data?: StyleProfile[] } | StyleProfile[] | undefined);
  const items: StyleProfile[] = Array.isArray(profileList)
    ? profileList
    : (profileList as { data?: StyleProfile[] })?.data ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meu Estilo</h1>
          <p className="text-muted-foreground">
            Perfis de estilo que a IA usa para gerar roteiros no seu tom
          </p>
        </div>
        <GenerateStyleDialog
          onGenerate={({ name, video_ids }) =>
            generateStyle.mutate({ name, video_ids })
          }
          isPending={generateStyle.isPending}
        />
      </div>

      {/* Content */}
      {styles.isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : styles.isError ? (
        <Card>
          <CardContent className="flex items-center gap-2 py-4 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span>Erro ao carregar perfis de estilo</span>
          </CardContent>
        </Card>
      ) : items.length === 0 ? (
        <EducationalEmptyState
          variant="no-references"
          title="Nenhum perfil de estilo ainda"
          description="Crie um perfil de estilo a partir dos seus vídeos de referência. A IA vai aprender seu tom, ritmo e tipo de gancho para gerar roteiros mais alinhados ao seu canal."
          tips={[
            "O estilo é gerado automaticamente a partir dos vídeos que você importou",
            "Você pode ter múltiplos perfis para diferentes nichos ou formatos",
            "Quanto mais vídeos de referência, mais preciso o estilo",
          ]}
          action={
            <GenerateStyleDialog
              onGenerate={({ name, video_ids }) =>
                generateStyle.mutate({ name, video_ids })
              }
              isPending={generateStyle.isPending}
            />
          }
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {items.map((style) => (
            <StyleCard
              key={style.id}
              style={style}
              onDelete={() => deleteStyle.mutate(style.id)}
              isDeleting={deleteStyle.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── StyleCard ───────────────────────────────────────────────────────────── */

function StyleCard({
  style,
  onDelete,
  isDeleting,
}: {
  style: StyleProfile;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <Palette className="h-4 w-4 shrink-0 text-primary" />
              <span className="truncate">{style.name}</span>
            </CardTitle>
            {style.description && (
              <CardDescription className="mt-1 line-clamp-2 text-xs">
                {style.description}
              </CardDescription>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Badge variant="outline" className="text-xs">
              {style.visibility === "public" ? (
                <><Globe className="mr-1 h-3 w-3" />Público</>
              ) : (
                <><Lock className="mr-1 h-3 w-3" />Privado</>
              )}
            </Badge>
            <ConfirmDialog
              trigger={
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  aria-label="Excluir estilo"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              }
              title="Excluir perfil de estilo?"
              description={`O perfil "${style.name}" será excluído permanentemente. Roteiros gerados com ele não serão afetados.`}
              confirmLabel="Excluir"
              onConfirm={onDelete}
              loading={isDeleting}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Atributos principais */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          {style.tone && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Mic className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Tom: <strong className="text-foreground">{style.tone}</strong></span>
            </div>
          )}
          {style.pacing && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Ritmo: <strong className="text-foreground">{style.pacing}</strong></span>
            </div>
          )}
        </div>

        {/* Hooks comuns */}
        {style.common_hooks && style.common_hooks.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Ganchos comuns
            </p>
            <div className="flex flex-wrap gap-1">
              {style.common_hooks.slice(0, 4).map((hook, i) => (
                <Badge key={i} variant="secondary" className="text-xs font-normal">
                  {hook}
                </Badge>
              ))}
              {style.common_hooks.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{style.common_hooks.length - 4}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* CTAs comuns */}
        {style.common_ctas && style.common_ctas.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Chamadas para ação comuns
            </p>
            <div className="flex flex-wrap gap-1">
              {style.common_ctas.slice(0, 3).map((cta, i) => (
                <Badge key={i} variant="outline" className="text-xs font-normal">
                  {cta}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Regras do/não faça */}
        <div className="grid grid-cols-2 gap-3">
          {style.do_rules && style.do_rules.length > 0 && (
            <div>
              <p className="mb-1 flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3 w-3" />
                Faça
              </p>
              <ul className="space-y-0.5">
                {style.do_rules.slice(0, 3).map((rule, i) => (
                  <li key={i} className="text-xs text-muted-foreground line-clamp-1">
                    · {rule}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {style.avoid_rules && style.avoid_rules.length > 0 && (
            <div>
              <p className="mb-1 flex items-center gap-1 text-xs font-medium text-destructive">
                <XCircle className="h-3 w-3" />
                Evite
              </p>
              <ul className="space-y-0.5">
                {style.avoid_rules.slice(0, 3).map((rule, i) => (
                  <li key={i} className="text-xs text-muted-foreground line-clamp-1">
                    · {rule}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Vídeos de referência */}
        {style.videos && style.videos.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground border-t pt-3">
            <Video className="h-3.5 w-3.5 shrink-0" />
            <span>
              Baseado em{" "}
              <strong className="text-foreground">{style.videos.length}</strong>{" "}
              vídeo{style.videos.length !== 1 ? "s" : ""} de referência
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── GenerateStyleDialog ─────────────────────────────────────────────────── */

function GenerateStyleDialog({
  onGenerate,
  isPending,
}: {
  onGenerate: (data: { name: string; video_ids: string[] }) => void;
  isPending: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [selectedVideoIds, setSelectedVideoIds] = useState<string[]>([]);
  const videos = useVideos({ status: "done" });
  const videoList = (videos.data as { data?: Array<{ id: string; title: string }> } | Array<{ id: string; title: string }> | undefined);
  const videoItems = Array.isArray(videoList) ? videoList : (videoList as { data?: Array<{ id: string; title: string }> })?.data ?? [];

  function toggleVideo(id: string) {
    setSelectedVideoIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  }

  function handleSubmit() {
    if (!name.trim() || selectedVideoIds.length === 0) return;
    onGenerate({ name: name.trim(), video_ids: selectedVideoIds });
    setOpen(false);
    setName("");
    setSelectedVideoIds([]);
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Criar Perfil de Estilo
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Criar Perfil de Estilo</DialogTitle>
          <DialogDescription>
            Selecione vídeos de referência para a IA aprender seu estilo de comunicação.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="style-name">Nome do perfil</Label>
            <Input
              id="style-name"
              placeholder="Ex: Educação informal, Humor rápido..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>
              Vídeos de referência{" "}
              <span className="text-muted-foreground text-xs font-normal">
                ({selectedVideoIds.length} selecionado{selectedVideoIds.length !== 1 ? "s" : ""})
              </span>
            </Label>
            {videos.isLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : videoItems.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                Nenhum vídeo processado ainda. Importe referências primeiro.
              </p>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-1.5 rounded-lg border p-2">
                {videoItems.map((video) => {
                  const selected = selectedVideoIds.includes(video.id);
                  return (
                    <button
                      key={video.id}
                      type="button"
                      onClick={() => toggleVideo(video.id)}
                      className={`w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
                        selected
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted"
                      }`}
                    >
                      <div
                        className={`h-3.5 w-3.5 shrink-0 rounded border ${
                          selected
                            ? "border-primary bg-primary"
                            : "border-muted-foreground"
                        }`}
                      />
                      <span className="truncate">{video.title}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name.trim() || selectedVideoIds.length === 0 || isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando...
              </>
            ) : (
              "Gerar Perfil"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
