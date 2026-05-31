"use client";

import { use } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/link-button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  useVideo,
  useVideoBeats,
  useVideoSegments,
} from "@/hooks/use-videos";
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  PenTool,
  Clock,
  Zap,
  AlertTriangle,
  Target,
  MessageCircleQuestion,
} from "lucide-react";
import type { BeatType, ScriptBeat, TranscriptSegment } from "@/types/api";

const beatColors: Record<BeatType, string> = {
  hook: "bg-red-500",
  setup: "bg-blue-500",
  conflict: "bg-orange-500",
  escalation: "bg-yellow-500",
  payoff: "bg-green-500",
  cta: "bg-purple-500",
};

const beatLabels: Record<BeatType, string> = {
  hook: "Hook",
  setup: "Setup",
  conflict: "Conflito",
  escalation: "Escalada",
  payoff: "Payoff",
  cta: "CTA",
};

const beatDescriptions: Record<BeatType, string> = {
  hook: "Abertura que captura a atenção nos primeiros segundos. Usa curiosidade, choque ou uma promessa forte para prender o espectador.",
  setup: "Contextualização do tema. Apresenta o cenário, o problema ou a situação que será explorada no vídeo.",
  conflict: "Ponto de tensão ou problema central. Cria engajamento ao mostrar um obstáculo, dúvida ou desafio que precisa ser resolvido.",
  escalation: "Intensificação da tensão. Adiciona camadas, reviravoltas ou novos elementos que aumentam o interesse e a urgência.",
  payoff: "Resolução e entrega de valor. O momento em que a promessa do hook é cumprida e o espectador recebe a recompensa.",
  cta: "Chamada para ação. Direciona o espectador para o próximo passo: curtir, comentar, se inscrever ou acessar um link.",
};

function formatTime(seconds: number | null | undefined): string {
  if (seconds == null) return "—";
  const min = Math.floor(seconds / 60);
  const sec = Math.round(seconds % 60);
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

function BeatTimeline({
  beats,
  totalDuration,
}: {
  beats: ScriptBeat[];
  totalDuration: number | null;
}) {
  if (!beats.length || !totalDuration) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">Timeline Narrativa</h3>
      <div className="relative h-10 bg-muted rounded-lg overflow-hidden">
        {beats.map((beat, i) => {
          const segment = beat as ScriptBeat & {
            start_time?: number;
            end_time?: number;
          };
          const start = segment.start_time ?? (i * totalDuration) / beats.length;
          const end =
            segment.end_time ?? ((i + 1) * totalDuration) / beats.length;
          const leftPct = (start / totalDuration) * 100;
          const widthPct = ((end - start) / totalDuration) * 100;

          return (
            <motion.div
              key={beat.id}
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: 1, scaleY: 1 }}
              transition={{ delay: i * 0.05 }}
              className={`absolute top-0 h-full ${beatColors[beat.beat_type]} opacity-80 hover:opacity-100 transition-opacity cursor-pointer`}
              style={{ left: `${leftPct}%`, width: `${Math.max(widthPct, 1)}%` }}
              title={`${beatLabels[beat.beat_type]} (${formatTime(start)} - ${formatTime(end)})`}
            />
          );
        })}
      </div>
    </div>
  );
}

function BeatLegend() {
  return (
    <div className="flex gap-3 flex-wrap">
      {(Object.keys(beatColors) as BeatType[]).map((type) => (
        <div
          key={type}
          className="relative flex items-center gap-1 text-xs cursor-help group"
        >
          <div className={`w-3 h-3 rounded-sm ${beatColors[type]}`} />
          <span>{beatLabels[type]}</span>
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 rounded-lg border bg-popover p-2.5 text-xs text-popover-foreground shadow-md opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-150 z-50">
            <span className="font-semibold">{beatLabels[type]}</span>
            <p className="mt-1 leading-relaxed text-muted-foreground">
              {beatDescriptions[type]}
            </p>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-px border-4 border-transparent border-b-border" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SegmentList({
  segments,
  beats,
}: {
  segments: TranscriptSegment[];
  beats: ScriptBeat[];
}) {
  const beatBySegment = new Map(beats.map((b) => [b.segment_id, b]));

  return (
    <ScrollArea className="h-[500px]">
      <div className="space-y-3 pr-4">
        {segments.map((segment) => {
          const beat = beatBySegment.get(segment.id);
          return (
            <motion.div
              key={segment.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="rounded-lg border p-3 space-y-2"
            >
              <div className="flex items-center gap-2 justify-between">
                <span className="text-xs font-mono text-muted-foreground">
                  {formatTime(segment.start_time)} -{" "}
                  {formatTime(segment.end_time)}
                </span>
                {beat && (
                  <Badge
                    variant="outline"
                    className="text-xs"
                    data-testid="beat-badge"
                  >
                    {beatLabels[beat.beat_type]}
                  </Badge>
                )}
              </div>
              <p className="text-sm leading-relaxed">{segment.text}</p>
              {beat && (
                <div className="flex flex-col gap-1 text-xs text-muted-foreground border-t pt-2 mt-2">
                  {beat.curiosity_question && (
                    <span className="flex items-center gap-1">
                      <MessageCircleQuestion className="h-3 w-3" />
                      {beat.curiosity_question}
                    </span>
                  )}
                  {beat.emotion && (
                    <span>
                      Emoção: {beat.emotion} (intensidade:{" "}
                      {Math.round((beat.intensity_score ?? 0) * 100)}%)
                    </span>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </ScrollArea>
  );
}

function AnalysisPanel({ beats }: { beats: ScriptBeat[] }) {
  const hookBeats = beats.filter((b) => b.beat_type === "hook");
  const avgIntensity =
    beats.length > 0
      ? beats.reduce((sum, b) => sum + (b.intensity_score ?? 0), 0) /
        beats.length
      : 0;
  const curiosityGaps = beats
    .filter((b) => b.curiosity_question)
    .map((b) => b.curiosity_question);
  const weakBeats = beats.filter((b) => (b.intensity_score ?? 0) < 0.4);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Análise Geral</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-medium">Hook Strength</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-500 rounded-full"
                style={{
                  width: `${
                    hookBeats.length > 0
                      ? (hookBeats[0].intensity_score ?? 0) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
            <span className="text-sm font-mono">
              {Math.round((hookBeats[0]?.intensity_score ?? 0) * 100)}%
            </span>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium">Intensidade Média</span>
          </div>
          <span className="text-2xl font-bold">{Math.round(avgIntensity * 100)}%</span>
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <MessageCircleQuestion className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium">
              Curiosity Gaps ({curiosityGaps.length})
            </span>
          </div>
          {curiosityGaps.length > 0 ? (
            <ul className="space-y-1">
              {curiosityGaps.slice(0, 5).map((q, i) => (
                <li key={i} className="text-xs text-muted-foreground">
                  &bull; {q}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">Nenhum detectado</p>
          )}
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-medium">
              Pontos Fracos ({weakBeats.length})
            </span>
          </div>
          {weakBeats.length > 0 ? (
            <ul className="space-y-1">
              {weakBeats.map((b) => (
                <li key={b.id} className="text-xs text-muted-foreground">
                  &bull; {beatLabels[b.beat_type]}: {Math.round((b.intensity_score ?? 0) * 100)}%
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">
              Nenhum ponto fraco detectado
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function VideoAnalysisPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const video = useVideo(id);
  const beats = useVideoBeats(id);
  const segments = useVideoSegments(id);

  if (video.isLoading || beats.isLoading || segments.isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (video.isError || !video.data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-2 text-destructive">
        <AlertCircle className="h-8 w-8" />
        <span>Erro ao carregar vídeo</span>
      </div>
    );
  }

  const v = video.data;

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <Link
        href="/library"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para Biblioteca
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">{v.title}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span>{v.creator_name ?? "Criador não informado"}</span>
            <span>&middot;</span>
            <span>{v.niche ?? "Sem nicho"}</span>
            <span>&middot;</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatTime(v.duration_seconds)}
            </span>
            <StatusBadge status={v.status} />
          </div>
        </div>
        <LinkButton href={`/generate?style_from=${v.id}`}>
          <PenTool className="h-4 w-4 mr-2" />
          Gerar Roteiro
        </LinkButton>
      </div>

      {/* Timeline */}
      {beats.data && (
        <div className="space-y-3">
          <Card>
            <CardContent className="pt-6">
              <BeatTimeline
                beats={beats.data}
                totalDuration={v.duration_seconds}
              />
            </CardContent>
          </Card>
          <BeatLegend />
        </div>
      )}

      {/* Main content */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Segments */}
        <Card>
          <CardHeader>
            <CardTitle>Segmentos</CardTitle>
            <CardDescription>
              {segments.data?.length ?? 0} segmentos detectados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {segments.data && beats.data ? (
              <SegmentList segments={segments.data} beats={beats.data} />
            ) : (
              <p className="text-sm text-muted-foreground">
                Segmentos não disponíveis
              </p>
            )}
          </CardContent>
        </Card>

        {/* Analysis Panel */}
        {beats.data && <AnalysisPanel beats={beats.data} />}
      </div>
    </div>
  );
}
