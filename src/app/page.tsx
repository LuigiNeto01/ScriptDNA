"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LinkButton } from "@/components/ui/link-button";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { useDashboardMetrics, useRecentVideos } from "@/hooks/use-videos";
import {
  Video,
  Upload,
  PenTool,
  Palette,
  Clock,
  TrendingUp,
  Loader2,
  AlertCircle,
} from "lucide-react";

function MetricCard({
  title,
  value,
  icon: Icon,
  description,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null) return "—";
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const min = Math.floor(seconds / 60);
  const sec = Math.round(seconds % 60);
  return `${min}m${sec}s`;
}

export default function DashboardPage() {
  const metrics = useDashboardMetrics();
  const recentVideos = useRecentVideos();

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral da sua biblioteca de roteiros
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <LinkButton href="/import">
            <Upload className="mr-2 h-4 w-4" />
            Importar
          </LinkButton>
          <LinkButton href="/generate" variant="outline">
            <PenTool className="mr-2 h-4 w-4" />
            Gerar Roteiro
          </LinkButton>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ))
        ) : metrics.isError ? (
          <Card className="col-span-full">
            <CardContent className="flex items-center gap-2 py-4 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span>Erro ao carregar métricas</span>
            </CardContent>
          </Card>
        ) : metrics.data ? (
          <>
            <MetricCard
              title="Vídeos Analisados"
              value={metrics.data.total_videos}
              icon={Video}
            />
            <MetricCard
              title="Estilos Criados"
              value={metrics.data.total_styles}
              icon={Palette}
            />
            <MetricCard
              title="Técnica Top"
              value={metrics.data.top_techniques[0]?.name ?? "—"}
              icon={TrendingUp}
              description={
                metrics.data.top_techniques[0]
                  ? `${metrics.data.top_techniques[0].count} usos`
                  : undefined
              }
            />
            <MetricCard
              title="Duração Média Hook"
              value={formatDuration(metrics.data.avg_hook_duration)}
              icon={Clock}
            />
          </>
        ) : null}
      </div>

      {/* Recent Videos */}
      <Card>
        <CardHeader>
          <CardTitle>Vídeos Recentes</CardTitle>
          <CardDescription>Últimos vídeos processados</CardDescription>
        </CardHeader>
        <CardContent>
          {recentVideos.isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : recentVideos.isError ? (
            <div className="flex items-center gap-2 text-destructive py-4">
              <AlertCircle className="h-5 w-5" />
              <span>Erro ao carregar vídeos recentes</span>
            </div>
          ) : !recentVideos.data?.length ? (
            <EmptyState
              icon={Video}
              title="Nenhum vídeo ainda"
              description="Importe seu primeiro vídeo para começar a analisar roteiros."
              action={
                <LinkButton href="/import">Importar Vídeo</LinkButton>
              }
            />
          ) : (
            <div className="space-y-3">
              {recentVideos.data.map((video) => (
                <Link
                  key={video.id}
                  href={`/videos/${video.id}`}
                  className="flex flex-col gap-3 rounded-lg border p-3 transition-colors hover:bg-accent sm:flex-row sm:items-center sm:justify-between"
                  data-testid="recent-video-item"
                >
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-sm">{video.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {video.creator_name ?? "Criador não informado"} &middot;{" "}
                      {video.niche ?? "Sem nicho"} &middot;{" "}
                      {formatDuration(video.duration_seconds)}
                    </span>
                  </div>
                  <div className="shrink-0">
                    <StatusBadge status={video.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
