"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { PageLoading } from "@/components/feedback/page-loading";
import { useAnalyzePerformance, usePerformanceAnalysis } from "@/hooks/use-analysis";
import { useTaskStatus } from "@/hooks/use-videos";
import { useFetchMetrics, useFetchTranscript, useMetricsHistory, useShortMetrics, useYouTubeShort } from "@/hooks/use-youtube";
import { BeatPerformancePanel } from "@/features/youtube-short/components/BeatPerformancePanel";
import { PerformanceAnalysisCard } from "@/features/youtube-short/components/PerformanceAnalysisCard";
import { ScriptAdherenceCard } from "@/features/youtube-short/components/ScriptAdherenceCard";
import { ShortActionPanel } from "@/features/youtube-short/components/ShortActionPanel";
import { ShortCommentsPanel } from "@/features/youtube-short/components/ShortCommentsPanel";
import { ShortDetailHeader } from "@/features/youtube-short/components/ShortDetailHeader";
import { ShortLearningPanel } from "@/features/youtube-short/components/ShortLearningPanel";
import { ShortMetricOverview } from "@/features/youtube-short/components/ShortMetricOverview";
import { ShortNextStepCard } from "@/features/youtube-short/components/ShortNextStepCard";
import { ShortScriptLinkCard } from "@/features/youtube-short/components/ShortScriptLinkCard";
import { ShortTranscriptPanel } from "@/features/youtube-short/components/ShortTranscriptPanel";
import { TimelineAnalysisView } from "@/features/youtube-short/components/TimelineAnalysisView";
import { AlertCircle } from "lucide-react";

export default function ShortDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const short = useYouTubeShort(id);
  const metrics = useShortMetrics(id);
  useMetricsHistory(id);
  const analysis = usePerformanceAnalysis(id);
  const fetchMetrics = useFetchMetrics();
  const fetchTranscript = useFetchTranscript();
  const analyzePerformance = useAnalyzePerformance();
  const [metricsTaskId, setMetricsTaskId] = useState<string | null>(null);
  const [analysisTaskId, setAnalysisTaskId] = useState<string | null>(null);
  const metricsTask = useTaskStatus(metricsTaskId);
  const analysisTask = useTaskStatus(analysisTaskId);

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

  function handleFetchMetrics() {
    fetchMetrics.mutate(id, {
      onSuccess: (res) => setMetricsTaskId(res.data.task_id),
    });
  }

  function handleFetchTranscript() {
    fetchTranscript.mutate(id);
  }

  function handleAnalyze() {
    analyzePerformance.mutate(id, {
      onSuccess: (res) => setAnalysisTaskId(res.data.task_id),
    });
  }

  if (short.isLoading) {
    return <PageLoading message="Carregando o Short..." />;
  }

  if (short.isError || !short.data) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 py-6 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <span>Nao conseguimos carregar esses dados agora. Tente novamente em alguns instantes.</span>
        </CardContent>
      </Card>
    );
  }

  const s = short.data;
  const analysisData = analysis.data;
  const metricData = metrics.data ?? (s.latest_metrics ? {
    id: "latest-summary",
    youtube_short_id: s.id,
    views: s.latest_metrics.views ?? 0,
    likes: s.latest_metrics.likes ?? 0,
    comments: s.latest_metrics.comments ?? 0,
    shares: s.latest_metrics.shares ?? 0,
    subscribers_gained: s.latest_metrics.subscribers_gained ?? 0,
    average_view_duration_seconds: null,
    average_view_percentage: s.latest_metrics.average_view_percentage,
    impressions: null,
    impressions_ctr: null,
    engagement_rate: s.latest_metrics.engagement_rate,
    retention_score: null,
    source: "manual" as const,
    collected_at: s.latest_metrics.collected_at,
    published_at: s.published_at,
  } : null);

  return (
    <div className="space-y-6">
      <ShortDetailHeader short={s} />

      <ShortMetricOverview metrics={metricData} />

      <ShortActionPanel
        scriptId={s.script_id}
        hasTranscript={!!s.transcript}
        onFetchMetrics={handleFetchMetrics}
        onFetchTranscript={handleFetchTranscript}
        onAnalyze={handleAnalyze}
        isFetchingMetrics={fetchMetrics.isPending}
        isFetchingTranscript={fetchTranscript.isPending}
        isAnalyzing={analyzePerformance.isPending}
        metricsTask={metricsTask.data}
        analysisTask={analysisTask.data}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <PerformanceAnalysisCard analysis={analysisData} />
          <TimelineAnalysisView timeline={analysisData?.timeline_analysis} />
          <BeatPerformancePanel scores={analysisData?.beat_scores ?? analysisData?.timeline_analysis?.beat_scores} />
          <ScriptAdherenceCard adherence={analysisData?.script_adherence} scriptId={s.script_id} />
          <ShortTranscriptPanel short={s} />
          <ShortCommentsPanel shortId={id} />
        </div>

        <div className="space-y-6">
          <ShortScriptLinkCard short={s} />
          <ShortNextStepCard short={s} analysis={analysisData} onFetchTranscript={handleFetchTranscript} onAnalyze={handleAnalyze} />
          <ShortLearningPanel learnings={analysisData?.actionable_learnings} />
        </div>
      </div>
    </div>
  );
}
