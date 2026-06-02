"use client";

import { use } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { PageLoading } from "@/components/feedback/page-loading";
import { useVideo, useVideoBeats, useVideoSegments } from "@/hooks/use-videos";
import { VideoBeatsTimeline } from "@/features/videos/components/VideoBeatsTimeline";
import { VideoDetailHeader } from "@/features/videos/components/VideoDetailHeader";
import { VideoOverviewCard } from "@/features/videos/components/VideoOverviewCard";
import { VideoReferenceUsageCard } from "@/features/videos/components/VideoReferenceUsageCard";
import { VideoTechniquesPanel } from "@/features/videos/components/VideoTechniquesPanel";
import { VideoTranscriptPanel } from "@/features/videos/components/VideoTranscriptPanel";
import { AlertCircle } from "lucide-react";

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
    return <PageLoading message="Carregando a analise da referencia..." />;
  }

  if (video.isError || !video.data) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 py-6 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <span>Nao conseguimos carregar esses dados agora. Tente novamente em alguns instantes.</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <VideoDetailHeader video={video.data} />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <VideoOverviewCard video={video.data} />
          <VideoBeatsTimeline beats={beats.data ?? []} totalDuration={video.data.duration_seconds} />
          <VideoTranscriptPanel segments={segments.data ?? []} beats={beats.data ?? []} />
        </div>

        <div className="space-y-6">
          <VideoTechniquesPanel techniques={video.data.segment_techniques} />
          <VideoReferenceUsageCard videoId={video.data.id} />
        </div>
      </div>
    </div>
  );
}
