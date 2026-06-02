"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageLoading } from "@/components/feedback/page-loading";
import { useTaskStatus } from "@/hooks/use-videos";
import { useConnectYouTube, useSyncShorts, useYouTubeChannel, useYouTubeShorts } from "@/hooks/use-youtube";
import { ShortsEmptyState } from "@/features/youtube/components/ShortsEmptyState";
import { ShortsFilter, ShortsFilterBar, ShortsSort } from "@/features/youtube/components/ShortsFilterBar";
import { ShortsGrid } from "@/features/youtube/components/ShortsGrid";
import { YoutubeChannelCard } from "@/features/youtube/components/YoutubeChannelCard";
import { YoutubeConnectionPanel } from "@/features/youtube/components/YoutubeConnectionPanel";
import { YoutubePageHeader } from "@/features/youtube/components/YoutubePageHeader";
import { YoutubeSyncPanel } from "@/features/youtube/components/YoutubeSyncPanel";
import { AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 12;

export default function YouTubePage() {
  const channel = useYouTubeChannel();
  const [page, setPage] = useState(0);
  const [syncTaskId, setSyncTaskId] = useState<string | null>(null);
  const [filter, setFilter] = useState<ShortsFilter>("all");
  const [sort, setSort] = useState<ShortsSort>("recent");
  const shorts = useYouTubeShorts({ limit: PAGE_SIZE, offset: page * PAGE_SIZE });
  const syncShorts = useSyncShorts();
  const connectYouTube = useConnectYouTube();
  const syncTask = useTaskStatus(syncTaskId);

  const connected = channel.data?.connected === true;

  useEffect(() => {
    if (syncTask.data?.status === "success") {
      shorts.refetch();
    }
  }, [shorts, syncTask.data?.status]);

  function handleConnect() {
    connectYouTube.mutate(undefined, {
      onSuccess: (res) => {
        window.location.href = res.data.authorization_url;
      },
    });
  }

  const visibleShorts = useMemo(() => {
    const items = [...(shorts.data?.items ?? [])];
    const filtered = items.filter((short) => {
      if (filter === "with_transcript") return !!short.transcript;
      if (filter === "without_transcript") return !short.transcript;
      if (filter === "linked") return !!short.script_id;
      if (filter === "unlinked") return !short.script_id;
      // Analysis and metrics are fetched inside cards today, so these two filters stay conservative.
      return true;
    });

    return filtered.sort((a, b) => {
      if (sort === "recent") {
        return new Date(b.published_at ?? 0).getTime() - new Date(a.published_at ?? 0).getTime();
      }
      return 0;
    });
  }, [filter, shorts.data?.items, sort]);

  return (
    <div className="space-y-6">
      <YoutubePageHeader />

      {connected ? (
        <>
          <YoutubeChannelCard channelName={channel.data?.channel_name} channelId={channel.data?.channel_id} />
          <YoutubeSyncPanel
            onSync={() =>
              syncShorts.mutate(undefined, {
                onSuccess: (res) => setSyncTaskId(res.data.task_id),
              })
            }
            isPending={syncShorts.isPending}
            task={syncTask.data}
          />
        </>
      ) : (
        <YoutubeConnectionPanel onConnect={handleConnect} isPending={connectYouTube.isPending} />
      )}

      {connectYouTube.isError && (
        <Card>
          <CardContent className="flex items-center gap-2 py-4 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span>Nao conseguimos iniciar a conexao com o YouTube agora. Faca login novamente e tente outra vez.</span>
          </CardContent>
        </Card>
      )}

      {shorts.isLoading ? (
        <PageLoading message="Carregando seus Shorts..." />
      ) : shorts.isError ? (
        <Card>
          <CardContent className="flex items-center gap-2 py-4 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span>Nao conseguimos carregar esses dados agora. Tente novamente em alguns instantes.</span>
          </CardContent>
        </Card>
      ) : !shorts.data?.items?.length ? (
        <ShortsEmptyState connected={connected} />
      ) : (
        <>
          <ShortsFilterBar filter={filter} sort={sort} onFilterChange={setFilter} onSortChange={setSort} />
          {visibleShorts.length > 0 ? <ShortsGrid shorts={visibleShorts} /> : <ShortsEmptyState connected={connected} />}

          {shorts.data.total > PAGE_SIZE && (
            <div className="flex items-center justify-center gap-4">
              <Button variant="outline" size="sm" onClick={() => setPage((current) => Math.max(0, current - 1))} disabled={page === 0}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Pagina {page + 1} de {Math.ceil(shorts.data.total / PAGE_SIZE)}
              </span>
              <Button variant="outline" size="sm" onClick={() => setPage((current) => current + 1)} disabled={(page + 1) * PAGE_SIZE >= shorts.data.total}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
