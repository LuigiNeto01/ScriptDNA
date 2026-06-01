"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  useYouTubeShort,
  useShortMetrics,
  useMetricsHistory,
  useFetchMetrics,
  useFetchTranscript,
  useSubmitManualMetrics,
} from "@/hooks/use-youtube";
import { usePerformanceAnalysis, useAnalyzePerformance } from "@/hooks/use-analysis";
import { useTaskStatus } from "@/hooks/use-videos";
import { BeatScoreCard } from "@/components/ai/beat-score-card";
import { ShortTimelineAnalysis } from "@/components/ai/short-timeline-analysis";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Loader2,
  Eye,
  ThumbsUp,
  MessageSquare,
  Share2,
  UserPlus,
  Clock,
  BarChart3,
  RefreshCw,
  FileText,
  Sparkles,
  Save,
} from "lucide-react";

export default function ShortDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const short = useYouTubeShort(id);
  const metrics = useShortMetrics(id);
  const history = useMetricsHistory(id);
  const analysis = usePerformanceAnalysis(id);
  const fetchMetrics = useFetchMetrics();
  const fetchTranscript = useFetchTranscript();
  const analyzePerformance = useAnalyzePerformance();
  const submitManual = useSubmitManualMetrics();
  const [metricsTaskId, setMetricsTaskId] = useState<string | null>(null);
  const [analysisTaskId, setAnalysisTaskId] = useState<string | null>(null);
  const metricsTask = useTaskStatus(metricsTaskId);
  const analysisTask = useTaskStatus(analysisTaskId);

  const [showManualForm, setShowManualForm] = useState(false);
  const [manualData, setManualData] = useState({
    views: "",
    likes: "",
    comments: "",
    shares: "",
    subscribers_gained: "",
    average_view_duration_seconds: "",
    average_view_percentage: "",
    impressions: "",
    impressions_ctr: "",
  });

  useEffect(() => {
    if (metricsTask.data?.status === "success") {
      metrics.refetch();
    }
  }, [metrics, metricsTask.data?.status]);

  useEffect(() => {
    if (analysisTask.data?.status === "success") {
      analysis.refetch();
    }
  }, [analysis, analysisTask.data?.status]);

  function handleManualSubmit() {
    if (!manualData.views) return;
    submitManual.mutate(
      {
        youtube_short_id: id,
        views: Number(manualData.views),
        likes: manualData.likes ? Number(manualData.likes) : undefined,
        comments: manualData.comments ? Number(manualData.comments) : undefined,
        shares: manualData.shares ? Number(manualData.shares) : undefined,
        subscribers_gained: manualData.subscribers_gained ? Number(manualData.subscribers_gained) : undefined,
        average_view_duration_seconds: manualData.average_view_duration_seconds ? Number(manualData.average_view_duration_seconds) : undefined,
        average_view_percentage: manualData.average_view_percentage ? Number(manualData.average_view_percentage) : undefined,
        impressions: manualData.impressions ? Number(manualData.impressions) : undefined,
        impressions_ctr: manualData.impressions_ctr ? Number(manualData.impressions_ctr) : undefined,
      },
      { onSuccess: () => setShowManualForm(false) }
    );
  }

  if (short.isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!short.data) {
    return <div className="py-12 text-center text-muted-foreground">Short nao encontrado</div>;
  }

  const s = short.data;
  const m = metrics.data;
  const analysisData = analysis.data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/youtube">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{s.title ?? "Sem titulo"}</h1>
          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
            {s.youtube_video_id && <span>{s.youtube_video_id}</span>}
            {s.duration_seconds != null && (
              <><span>&middot;</span><Clock className="h-3.5 w-3.5" /><span>{s.duration_seconds}s</span></>
            )}
            {s.published_at && (
              <><span>&middot;</span><span>{new Date(s.published_at).toLocaleDateString("pt-BR")}</span></>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              fetchMetrics.mutate(id, {
                onSuccess: (res) => setMetricsTaskId(res.data.task_id),
              })
            }
            disabled={fetchMetrics.isPending}
          >
            {fetchMetrics.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Atualizar Metricas
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchTranscript.mutate(id)}
            disabled={fetchTranscript.isPending || !!s.transcript}
          >
            {fetchTranscript.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
            {s.transcript ? "Transcrito" : "Transcrever"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              analyzePerformance.mutate(id, {
                onSuccess: (res) => setAnalysisTaskId(res.data.task_id),
              })
            }
            disabled={analyzePerformance.isPending}
          >
            {analyzePerformance.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Analisar
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main Column */}
        <div className="space-y-4">
          {/* Thumbnail / Embed */}
          {s.thumbnail_url && (
            <Card>
              <CardContent className="relative h-80 overflow-hidden rounded-lg p-0">
                <Image
                  src={s.thumbnail_url}
                  alt={s.title ?? "Short"}
                  fill
                  unoptimized
                  className="object-cover"
                />
              </CardContent>
            </Card>
          )}

          {/* Metrics Cards */}
          {m && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <MetricCard icon={Eye} label="Views" value={formatNumber(m.views)} />
              <MetricCard icon={ThumbsUp} label="Likes" value={formatNumber(m.likes)} />
              <MetricCard icon={MessageSquare} label="Comentarios" value={formatNumber(m.comments)} />
              <MetricCard icon={Share2} label="Compartilhamentos" value={formatNumber(m.shares)} />
              <MetricCard icon={UserPlus} label="Inscritos" value={formatNumber(m.subscribers_gained)} />
              <MetricCard
                icon={Clock}
                label="Duracao media"
                value={m.average_view_duration_seconds != null ? formatClock(m.average_view_duration_seconds) : "-"}
              />
            </div>
          )}

          {metricsTask.data && (
            <Card>
              <CardContent className="py-3 text-sm">
                <span className="font-medium">Atualizacao de metricas: </span>
                <span>{metricsTask.data.status}</span>
                {metricsTask.data.error && (
                  <p className="mt-1 text-destructive">{metricsTask.data.error}</p>
                )}
              </CardContent>
            </Card>
          )}

          {analysisTask.data && (
            <Card>
              <CardContent className="py-3 text-sm">
                <span className="font-medium">Analise do video: </span>
                <span>{analysisTask.data.status}</span>
                {analysisTask.data.current_step && (
                  <p className="mt-1 text-muted-foreground">{analysisTask.data.current_step}</p>
                )}
                {analysisTask.data.error && (
                  <p className="mt-1 text-destructive">{analysisTask.data.error}</p>
                )}
              </CardContent>
            </Card>
          )}

          {m && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {m.average_view_percentage != null && (
                <MetricCard icon={BarChart3} label="Retencao Media" value={`${Math.round(m.average_view_percentage)}%`} />
              )}
              {m.impressions_ctr != null && (
                <MetricCard icon={Eye} label="CTR" value={`${(m.impressions_ctr * 100).toFixed(1)}%`} />
              )}
              {m.engagement_rate != null && (
                <MetricCard icon={BarChart3} label="Engajamento" value={`${m.engagement_rate.toFixed(1)}%`} />
              )}
            </div>
          )}

          {/* Transcript */}
          {s.transcript && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Transcricao
                  {s.transcript_source && (
                    <Badge variant="outline" className="text-xs">{s.transcript_source}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{s.transcript}</p>
              </CardContent>
            </Card>
          )}

          {/* Performance Analysis */}
          {analysisData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Analise de Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Scores */}
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {Object.entries(analysisData.scores).map(([key, val]) =>
                    val != null ? (
                      <div key={key} className="rounded-lg border p-2 text-center">
                        <p className="text-xs text-muted-foreground capitalize">{key}</p>
                        <p className="text-lg font-bold">{formatAnalysisScore(val)}</p>
                      </div>
                    ) : null
                  )}
                </div>

                {analysisData.script_adherence && (
                  <div className="rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <h4 className="text-sm font-semibold">Aderencia ao Roteiro</h4>
                      <Badge variant="outline">
                        {analysisData.script_adherence.script_adherence_score != null
                          ? `${Math.round(analysisData.script_adherence.script_adherence_score * 100)}%`
                          : "sem score"}
                      </Badge>
                    </div>
                    {analysisData.script_adherence.major_differences.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {analysisData.script_adherence.major_differences.slice(0, 3).map((item, i) => (
                          <li key={i} className="text-xs text-muted-foreground">&bull; {item}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {analysisData.beat_scores && (
                  <BeatScoreCard scores={analysisData.beat_scores} />
                )}

                {analysisData.timeline_analysis && (
                  <ShortTimelineAnalysis timeline={analysisData.timeline_analysis} />
                )}

                {/* Strengths */}
                {analysisData.strengths && analysisData.strengths.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Pontos Fortes</h4>
                    <ul className="space-y-1">
                      {analysisData.strengths.map((p, i) => (
                        <li key={i} className="text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">{p.aspect}</span>: {p.description}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Weaknesses */}
                {analysisData.weaknesses && analysisData.weaknesses.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Pontos Fracos</h4>
                    <ul className="space-y-1">
                      {analysisData.weaknesses.map((p, i) => (
                        <li key={i} className="text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">{p.aspect}</span>: {p.description}
                          {p.suggestion && <span className="block text-xs italic mt-0.5">Sugestao: {p.suggestion}</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Learnings */}
                {analysisData.actionable_learnings && analysisData.actionable_learnings.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Aprendizados</h4>
                    <ul className="space-y-1">
                      {analysisData.actionable_learnings.map((l, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Badge variant={l.priority === "high" || l.sentiment === "negative" ? "destructive" : l.priority === "medium" || l.sentiment === "positive" ? "default" : "secondary"} className="shrink-0 text-[10px]">
                            {l.priority ?? l.sentiment ?? l.category ?? "learn"}
                          </Badge>
                          <span className="text-muted-foreground">
                            {l.learning ?? l.claim ?? l.recommended_action}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informacoes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {s.description && (
                <div>
                  <span className="text-muted-foreground">Descricao</span>
                  <p className="mt-0.5 line-clamp-4">{s.description}</p>
                </div>
              )}
              {s.tags && s.tags.length > 0 && (
                <div>
                  <span className="text-muted-foreground">Tags</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {s.tags.map((tag, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {m?.source && (
                <div>
                  <span className="text-muted-foreground">Fonte das metricas</span>
                  <p className="mt-0.5">{m.source}</p>
                </div>
              )}
              {s.script_id && (
                <div>
                  <span className="text-muted-foreground">Roteiro vinculado</span>
                  <Link href={`/scripts/${s.script_id}`} className="block mt-0.5 text-primary hover:underline">
                    Ver roteiro
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Manual Metrics */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Metricas Manuais</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowManualForm(!showManualForm)}>
                  {showManualForm ? "Cancelar" : "Inserir"}
                </Button>
              </div>
            </CardHeader>
            {showManualForm && (
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Views *</Label>
                  <Input type="number" value={manualData.views} onChange={(e) => setManualData((d) => ({ ...d, views: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Likes</Label>
                    <Input type="number" value={manualData.likes} onChange={(e) => setManualData((d) => ({ ...d, likes: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Comentarios</Label>
                    <Input type="number" value={manualData.comments} onChange={(e) => setManualData((d) => ({ ...d, comments: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Compartilh.</Label>
                    <Input type="number" value={manualData.shares} onChange={(e) => setManualData((d) => ({ ...d, shares: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Inscritos</Label>
                    <Input type="number" value={manualData.subscribers_gained} onChange={(e) => setManualData((d) => ({ ...d, subscribers_gained: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Retencao %</Label>
                    <Input type="number" value={manualData.average_view_percentage} onChange={(e) => setManualData((d) => ({ ...d, average_view_percentage: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Duracao media (s)</Label>
                    <Input type="number" value={manualData.average_view_duration_seconds} onChange={(e) => setManualData((d) => ({ ...d, average_view_duration_seconds: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">CTR</Label>
                    <Input type="number" step="0.01" value={manualData.impressions_ctr} onChange={(e) => setManualData((d) => ({ ...d, impressions_ctr: e.target.value }))} />
                  </div>
                </div>
                <Button onClick={handleManualSubmit} disabled={!manualData.views || submitManual.isPending} className="w-full" size="sm">
                  {submitManual.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Salvar Metricas
                </Button>
              </CardContent>
            )}
          </Card>

          {/* Metrics History */}
          {history.data && history.data.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Historico</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {history.data.slice(0, 10).map((entry, i) => (
                    <div key={i} className="flex items-center justify-between text-sm border-b pb-1 last:border-0">
                      <span className="text-muted-foreground text-xs">
                        {entry.collected_at ? new Date(entry.collected_at).toLocaleDateString("pt-BR") : "—"}
                      </span>
                      <div className="flex gap-3 text-xs">
                        {entry.views != null && <span>{formatNumber(entry.views)} views</span>}
                        {entry.likes != null && <span>{formatNumber(entry.likes)} likes</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-2 p-3">
        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-sm font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatClock(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(total / 60);
  const remainder = total % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

function formatAnalysisScore(value: number): string {
  if (value <= 1) return `${Math.round(value * 100)}%`;
  return `${value.toFixed(1)}/10`;
}
