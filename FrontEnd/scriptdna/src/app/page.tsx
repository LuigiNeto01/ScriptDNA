"use client";

import { ActivationChecklist, buildActivationChecklist } from "@/features/onboarding/ActivationChecklist";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { SetupBanner } from "@/features/onboarding/SetupBanner";
import { DashboardPageHeader } from "@/features/dashboard/components/DashboardPageHeader";
import { NextBestActionCard } from "@/features/dashboard/components/NextBestActionCard";
import { DashboardMetricGrid } from "@/features/dashboard/components/DashboardMetricGrid";
import { RecentScriptsPanel } from "@/features/dashboard/components/RecentScriptsPanel";
import { YoutubeStatusCard } from "@/features/dashboard/components/YoutubeStatusCard";
import { TopIdeasPanel } from "@/features/dashboard/components/TopIdeasPanel";
import { TopInsightsPanel } from "@/features/dashboard/components/TopInsightsPanel";
import { RecentReferencesPanel } from "@/features/dashboard/components/RecentReferencesPanel";
import { DashboardSecondaryMetrics } from "@/features/dashboard/components/DashboardSecondaryMetrics";
import { useDashboardMetrics, useRecentVideos } from "@/hooks/use-videos";
import { useScripts } from "@/hooks/use-scripts";
import { useYouTubeChannel, useYouTubeShorts } from "@/hooks/use-youtube";
import { useInsights } from "@/hooks/use-insights";
import { useSuggestions } from "@/hooks/use-suggestions";
import { useAuthStore } from "@/stores/auth-store";
import { useVideos } from "@/hooks/use-videos";
import {
  Lightbulb,
  PenTool,
  PlugZap,
  Upload,
  Video,
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const metrics = useDashboardMetrics();
  const recentVideos = useRecentVideos();
  const scripts = useScripts({ limit: 6 });
  const shorts = useYouTubeShorts({ limit: 1 });
  const channel = useYouTubeChannel();
  const insights = useInsights({ active_only: true, limit: 3 });
  const suggestions = useSuggestions({ status: "pending", limit: 3 });
  const references = useVideos({ status: "done" });

  const connected = channel.data?.connected === true;
  const refsData = references.data as { data?: unknown[] } | undefined;
  const hasReferences = (refsData?.data?.length ?? 0) > 0;

  const onboarding = useOnboardingStore();
  const showSetupBanner = !onboarding.completed;

  const checklistItems = buildActivationChecklist({
    hasYouTube: connected,
    hasShorts: (shorts.data?.total ?? 0) >= 3,
    hasReferences,
    hasScripts: (scripts.data?.length ?? 0) > 0,
    hasInsights: (insights.data?.total ?? 0) > 0,
    hasGoal: !!onboarding.goal,
    hasNiche: !!(onboarding.niche?.trim()),
  });
  const checklistVisible = checklistItems.some((i) => !i.completed);

  const nextAction = (() => {
    if (!connected) return { label: "Conecte seu canal do YouTube", href: "/youtube", icon: Video };
    if ((shorts.data?.total ?? 0) < 3) return { label: "Importe mais Shorts para análise", href: "/youtube", icon: PlugZap };
    if (!hasReferences) return { label: "Adicione referências para calibrar o estilo da IA", href: "/import", icon: Upload };
    if ((scripts.data?.length ?? 0) === 0) return { label: "Gere seu primeiro roteiro com IA", href: "/generate", icon: PenTool };
    if ((insights.data?.total ?? 0) === 0) return { label: "Analise um Short para gerar aprendizados", href: "/youtube", icon: Lightbulb };
    return { label: "Gere um novo roteiro baseado nos seus aprendizados", href: "/generate", icon: PenTool };
  })();

  const greeting = user?.name ? `Olá, ${user.name.split(" ")[0]}!` : "Olá!";

  const totalVideos = metrics.data?.total_videos ?? 0;
  const totalScripts = metrics.data?.total_scripts ?? scripts.data?.length ?? 0;
  const totalShorts = metrics.data?.total_shorts ?? shorts.data?.total ?? 0;
  const totalInsights = metrics.data?.active_insights ?? insights.data?.total ?? 0;

  return (
    <div className="space-y-8">
      <DashboardPageHeader greeting={greeting} />

      {showSetupBanner && (
        <SetupBanner
          currentStep={onboarding.currentStep}
          goal={onboarding.goal}
          niche={onboarding.niche}
          onDismiss={onboarding.complete}
        />
      )}

      {checklistVisible && <ActivationChecklist items={checklistItems} />}

      <NextBestActionCard action={nextAction} />

      <DashboardMetricGrid
        isLoading={metrics.isLoading}
        isError={metrics.isError}
        totalVideos={totalVideos}
        totalScripts={totalScripts}
        totalShorts={totalShorts}
        totalInsights={totalInsights}
        connected={connected}
      />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <RecentScriptsPanel
          scripts={scripts.data ?? []}
          isLoading={scripts.isLoading}
          isError={scripts.isError}
        />

        <div className="space-y-6">
          <YoutubeStatusCard
            connected={connected}
            channelName={channel.data?.channel_name}
          />
          <TopIdeasPanel
            items={suggestions.data?.items ?? []}
            isLoading={suggestions.isLoading}
          />
        </div>
      </div>

      <TopInsightsPanel
        insights={insights.data?.items ?? []}
        isLoading={insights.isLoading}
      />

      <RecentReferencesPanel
        videos={recentVideos.data ?? []}
        isLoading={recentVideos.isLoading}
      />

      {metrics.data && <DashboardSecondaryMetrics metrics={metrics.data} />}
    </div>
  );
}
