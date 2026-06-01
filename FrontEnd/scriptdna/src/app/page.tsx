"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/link-button";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { useDashboardMetrics, useRecentVideos } from "@/hooks/use-videos";
import { useScripts } from "@/hooks/use-scripts";
import { useYouTubeChannel, useYouTubeShorts } from "@/hooks/use-youtube";
import { useInsights } from "@/hooks/use-insights";
import { useSuggestions } from "@/hooks/use-suggestions";
import { useAiCosts, useDetailedHealth } from "@/hooks/use-observability";
import {
  AlertCircle,
  Clock,
  DollarSign,
  FileText,
  HeartPulse,
  Lightbulb,
  Loader2,
  Palette,
  PenTool,
  PlugZap,
  Sparkles,
  TrendingUp,
  Upload,
  Video,
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
        <div className="truncate text-2xl font-bold">{value}</div>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null) return "-";
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const min = Math.floor(seconds / 60);
  const sec = Math.round(seconds % 60);
  return `${min}m${sec}s`;
}

export default function DashboardPage() {
  const metrics = useDashboardMetrics();
  const recentVideos = useRecentVideos();
  const scripts = useScripts({ limit: 6 });
  const shorts = useYouTubeShorts({ limit: 1 });
  const channel = useYouTubeChannel();
  const insights = useInsights({ active_only: true, limit: 1 });
  const suggestions = useSuggestions({ status: "pending", limit: 3 });

  const aiCosts = useAiCosts(30);
  const systemHealth = useDetailedHealth();
  const connected = channel.data?.connected === true;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Visao geral do ciclo gerar, publicar, medir e aprender.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <LinkButton href="/scripts/new">
            <PenTool className="mr-2 h-4 w-4" />
            Novo Roteiro
          </LinkButton>
          <LinkButton href="/import" variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Importar
          </LinkButton>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
              <span>Erro ao carregar metricas</span>
            </CardContent>
          </Card>
        ) : (
          <>
            <MetricCard
              title="Vídeos Analisados"
              value={metrics.data?.total_videos ?? 0}
              icon={Video}
            />
            <MetricCard
              title="Roteiros Criados"
              value={metrics.data?.total_scripts ?? scripts.data?.length ?? 0}
              icon={FileText}
              description="Roteiros versionados"
            />
            <MetricCard
              title="Shorts Importados"
              value={metrics.data?.total_shorts ?? shorts.data?.total ?? 0}
              icon={PlugZap}
              description={connected ? "YouTube conectado" : "Canal pendente"}
            />
            <MetricCard
              title="Insights Ativos"
              value={metrics.data?.active_insights ?? insights.data?.total ?? 0}
              icon={Lightbulb}
              description="Aprendizados validados"
            />
          </>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Roteiros Recentes</CardTitle>
                <CardDescription>Ultimos roteiros do fluxo v2</CardDescription>
              </div>
              <LinkButton href="/scripts" variant="outline" size="sm">
                Ver todos
              </LinkButton>
            </div>
          </CardHeader>
          <CardContent>
            {scripts.isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : scripts.isError ? (
              <div className="flex items-center gap-2 py-4 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <span>Erro ao carregar roteiros</span>
              </div>
            ) : !scripts.data?.length ? (
              <EmptyState
                icon={FileText}
                title="Nenhum roteiro ainda"
                description="Crie um roteiro para iniciar o ciclo de melhoria."
                action={<LinkButton href="/scripts/new">Criar Roteiro</LinkButton>}
              />
            ) : (
              <div className="space-y-3">
                {scripts.data.slice(0, 5).map((script) => (
                  <Link
                    key={script.id}
                    href={`/scripts/${script.id}`}
                    className="flex flex-col gap-3 rounded-lg border p-3 transition-colors hover:bg-accent sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{script.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {script.niche ?? "Sem nicho"} ·{" "}
                        {script.estimated_duration_seconds ?? "-"}s ·{" "}
                        {new Date(script.updated_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <Badge className="w-fit" variant="outline">
                      {script.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status YouTube</CardTitle>
              <CardDescription>Conexao e dados do canal</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">
                    {connected
                      ? channel.data?.channel_name ?? "Canal conectado"
                      : "Canal nao conectado"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {connected
                      ? "Pronto para sincronizar Shorts"
                      : "Conecte o canal em YouTube"}
                  </p>
                </div>
                <Badge variant={connected ? "default" : "secondary"}>
                  {connected ? "Online" : "Pendente"}
                </Badge>
              </div>
              <LinkButton href="/youtube" className="w-full" variant="outline">
                Abrir YouTube
              </LinkButton>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sugestoes Recentes</CardTitle>
              <CardDescription>Top 3 ideias pendentes</CardDescription>
            </CardHeader>
            <CardContent>
              {suggestions.isLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : suggestions.isError ? (
                <div className="flex items-center gap-2 py-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span>Erro ao carregar sugestoes</span>
                </div>
              ) : !suggestions.data?.items?.length ? (
                <EmptyState
                  icon={Sparkles}
                  title="Sem sugestoes pendentes"
                  description="Gere novas ideias a partir dos seus dados."
                />
              ) : (
                <div className="space-y-3">
                  {suggestions.data.items.map((suggestion) => (
                    <Link
                      key={suggestion.id}
                      href="/ideas"
                      className="block rounded-lg border p-3 transition-colors hover:bg-accent"
                    >
                      <p className="line-clamp-2 text-sm font-medium">
                        {suggestion.title}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {suggestion.confidence_score != null
                          ? `${Math.round(suggestion.confidence_score * 100)}% confianca`
                          : "Confianca pendente"}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vídeos Recentes</CardTitle>
          <CardDescription>Ultimos videos processados na biblioteca</CardDescription>
        </CardHeader>
        <CardContent>
          {recentVideos.isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : recentVideos.isError ? (
            <div className="flex items-center gap-2 py-4 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span>Erro ao carregar videos recentes</span>
            </div>
          ) : !recentVideos.data?.length ? (
            <EmptyState
              icon={Video}
              title="Nenhum vídeo ainda"
              description="Importe seu primeiro video para comecar a analisar roteiros."
              action={<LinkButton href="/import">Importar Video</LinkButton>}
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
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="truncate text-sm font-medium">{video.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {video.creator_name ?? "Criador nao informado"} ·{" "}
                      {video.niche ?? "Sem nicho"} ·{" "}
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

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Operacao IA</CardTitle>
              <CardDescription>Resumo de custos, runs e status do sistema</CardDescription>
            </div>
            <div className="flex gap-2">
              <LinkButton href="/dashboard/ai-costs" variant="outline" size="sm">
                Custos IA
              </LinkButton>
              <LinkButton href="/system/health" variant="outline" size="sm">
                Sistema
              </LinkButton>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border p-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                Custo Estimado (30d)
              </div>
              <p className="mt-1 text-xl font-bold">
                {aiCosts.data?.total_cost_usd != null
                  ? `$${aiCosts.data.total_cost_usd.toFixed(2)}`
                  : "-"}
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4" />
                Runs de IA (30d)
              </div>
              <p className="mt-1 text-xl font-bold">
                {aiCosts.data?.total_runs ?? 0}
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                Erros Recentes
              </div>
              <p className="mt-1 text-xl font-bold">
                {aiCosts.data?.error_runs ?? 0}
              </p>
              {aiCosts.data?.error_rate != null && aiCosts.data.error_rate > 0 && (
                <p className="text-xs text-destructive">
                  {(aiCosts.data.error_rate * 100).toFixed(1)}% taxa de erro
                </p>
              )}
            </div>
            <div className="rounded-lg border p-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <HeartPulse className="h-4 w-4" />
                Status Geral
              </div>
              <p className="mt-1 text-xl font-bold">
                {systemHealth.isLoading
                  ? "..."
                  : systemHealth.data?.status === "ok"
                    ? "OK"
                    : systemHealth.data?.status === "degraded"
                      ? "Degradado"
                      : "-"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <MetricCard
          title="Estilos Criados"
          value={metrics.data?.total_styles ?? 0}
          icon={Palette}
        />
        <MetricCard
          title="Tecnica Top"
          value={metrics.data?.top_techniques?.[0]?.name ?? "-"}
          icon={TrendingUp}
          description={
            metrics.data?.top_techniques?.[0]
              ? `${metrics.data.top_techniques[0].count} usos`
              : undefined
          }
        />
        <MetricCard
          title="Duracao Media Hook"
          value={formatDuration(metrics.data?.avg_hook_duration)}
          icon={Clock}
        />
        <MetricCard
          title="Views Medias"
          value={formatCompact(metrics.data?.avg_views)}
          icon={TrendingUp}
          description="Shorts do canal"
        />
        <MetricCard
          title="Retencao Media"
          value={formatPercent(metrics.data?.avg_retention)}
          icon={Clock}
          description="Media disponivel"
        />
        <MetricCard
          title="Engajamento Medio"
          value={formatPercent(metrics.data?.avg_engagement)}
          icon={Sparkles}
          description="Media disponivel"
        />
      </div>
    </div>
  );
}

function formatCompact(value: number | null | undefined): string {
  if (value == null) return "-";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return `${Math.round(value)}`;
}

function formatPercent(value: number | null | undefined): string {
  if (value == null) return "-";
  return `${value.toFixed(1)}%`;
}
