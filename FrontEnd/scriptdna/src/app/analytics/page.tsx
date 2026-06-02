"use client";

import { useState } from "react";
import { useYouTubeShorts } from "@/hooks/use-youtube";
import { useScripts } from "@/hooks/use-scripts";
import { useInsights } from "@/hooks/use-insights";
import { useSuggestions } from "@/hooks/use-suggestions";
import { useAnalyzeChannel, useIdentifyPatterns } from "@/hooks/use-analysis";
import { useTaskStatus } from "@/hooks/use-videos";
import { AnalyticsPageHeader } from "@/features/analytics/components/AnalyticsPageHeader";
import { AnalyticsMetricOverview } from "@/features/analytics/components/AnalyticsMetricOverview";
import { ChannelAnalysisCard } from "@/features/analytics/components/ChannelAnalysisCard";
import { PatternDiscoveryCard } from "@/features/analytics/components/PatternDiscoveryCard";

export default function AnalyticsPage() {
  const [channelTaskId, setChannelTaskId] = useState<string | null>(null);
  const [patternsTaskId, setPatternsTaskId] = useState<string | null>(null);

  const shorts = useYouTubeShorts({ limit: 1 });
  const scripts = useScripts();
  const insights = useInsights({ active_only: true, limit: 1 });
  const suggestions = useSuggestions({ limit: 1 });
  const analyzeChannel = useAnalyzeChannel();
  const identifyPatterns = useIdentifyPatterns();
  const channelTask = useTaskStatus(channelTaskId);
  const patternsTask = useTaskStatus(patternsTaskId);

  const handleAnalyzeChannel = () =>
    analyzeChannel.mutate(undefined, {
      onSuccess: (res) => setChannelTaskId(res.data.task_id),
    });

  const handleIdentifyPatterns = () =>
    identifyPatterns.mutate(undefined, {
      onSuccess: (res) => setPatternsTaskId(res.data.task_id),
    });

  return (
    <div className="space-y-6">
      <AnalyticsPageHeader
        onAnalyzeChannel={handleAnalyzeChannel}
        onIdentifyPatterns={handleIdentifyPatterns}
        isPendingChannel={analyzeChannel.isPending}
        isPendingPatterns={identifyPatterns.isPending}
      />

      <AnalyticsMetricOverview
        totalShorts={shorts.data?.total ?? 0}
        totalScripts={scripts.data?.length ?? 0}
        totalInsights={insights.data?.total ?? 0}
        totalSuggestions={suggestions.data?.total ?? 0}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <ChannelAnalysisCard
          taskData={channelTask.data}
          isPending={analyzeChannel.isPending}
          onRun={handleAnalyzeChannel}
        />
        <PatternDiscoveryCard
          taskData={patternsTask.data}
          isPending={identifyPatterns.isPending}
          onRun={handleIdentifyPatterns}
        />
      </div>
    </div>
  );
}
