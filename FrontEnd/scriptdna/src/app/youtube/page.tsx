"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  useConnectYouTube,
  useYouTubeChannel,
  useYouTubeShorts,
  useSyncShorts,
} from "@/hooks/use-youtube";
import { useTaskStatus } from "@/hooks/use-videos";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Video,
  RefreshCw,
  Loader2,
  AlertCircle,
  Wifi,
  WifiOff,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const PAGE_SIZE = 12;

function getSyncMessage(result: unknown) {
  if (!result || typeof result !== "object") return null;
  if ("shorts_synced" in result) {
    const synced = String(result.shorts_synced);
    const updated = "metrics_updated" in result ? String(result.metrics_updated) : null;
    return updated
      ? `${synced} Shorts novos, ${updated} metricas atualizadas`
      : `${synced} Shorts sincronizados`;
  }
  return "Processamento concluido";
}

export default function YouTubePage() {
  const channel = useYouTubeChannel();
  const [page, setPage] = useState(0);
  const [syncTaskId, setSyncTaskId] = useState<string | null>(null);
  const shorts = useYouTubeShorts({ limit: PAGE_SIZE, offset: page * PAGE_SIZE });
  const syncShorts = useSyncShorts();
  const connectYouTube = useConnectYouTube();
  const syncTask = useTaskStatus(syncTaskId);

  const connected = channel.data?.connected === true;
  const syncMessage = getSyncMessage(syncTask.data?.result);

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">YouTube</h1>
          <p className="text-muted-foreground">Gerencie seus Shorts e metricas</p>
        </div>
        {connected && (
          <Button
            onClick={() =>
              syncShorts.mutate(undefined, {
                onSuccess: (res) => setSyncTaskId(res.data.task_id),
              })
            }
            disabled={syncShorts.isPending}
          >
            {syncShorts.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Sincronizar Shorts
          </Button>
        )}
      </div>

      {/* Channel Status */}
      <Card>
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            {connected ? (
              <Wifi className="h-5 w-5 text-green-500" />
            ) : (
              <WifiOff className="h-5 w-5 text-muted-foreground" />
            )}
            <div>
              <p className="font-medium">
                {connected
                  ? `Canal: ${channel.data?.channel_name ?? channel.data?.channel_id}`
                  : "Canal nao conectado"}
              </p>
              <p className="text-sm text-muted-foreground">
                {connected
                  ? "Dados sincronizados com YouTube"
                  : "Conecte seu canal para importar Shorts"}
              </p>
            </div>
          </div>
          {!connected && (
            <Button onClick={handleConnect} disabled={connectYouTube.isPending}>
              {connectYouTube.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Video className="mr-2 h-4 w-4" />
              )}
              Conectar Canal
            </Button>
          )}
        </CardContent>
      </Card>

      {connectYouTube.isError && (
        <Card>
          <CardContent className="flex items-center gap-2 py-4 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span>Erro ao iniciar conexao com YouTube. Faca login novamente e tente de novo.</span>
          </CardContent>
        </Card>
      )}

      {syncTask.data && (
        <Card>
          <CardContent className="py-4">
            <p className="text-sm font-medium">Sincronizacao: {syncTask.data.status}</p>
            {syncMessage && (
              <p className="mt-1 text-sm text-muted-foreground">
                {syncMessage}
              </p>
            )}
            {syncTask.data.error && (
              <p className="mt-1 text-sm text-destructive">{syncTask.data.error}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Shorts Grid */}
      {shorts.isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : shorts.isError ? (
        <Card>
          <CardContent className="flex items-center gap-2 py-4 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span>Erro ao carregar shorts</span>
          </CardContent>
        </Card>
      ) : !shorts.data?.items?.length ? (
        <EmptyState
          icon={Video}
          title="Nenhum Short importado"
          description={
            connected
              ? 'Clique em "Sincronizar Shorts" para importar seus videos.'
              : "Conecte seu canal do YouTube para comecar."
          }
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {shorts.data.items.map((short) => (
              <Link key={short.id} href={`/youtube/shorts/${short.id}`}>
                <Card className="h-full overflow-hidden transition-colors hover:bg-accent/50 cursor-pointer">
                  {short.thumbnail_url ? (
                    <div className="relative aspect-[9/16] max-h-48 w-full overflow-hidden bg-muted">
                      <Image
                        src={short.thumbnail_url}
                        alt={short.title ?? "Short"}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-32 items-center justify-center bg-muted">
                      <Video className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <CardContent className="p-3">
                    <p className="text-sm font-medium line-clamp-2">
                      {short.title ?? "Sem titulo"}
                    </p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                      {short.duration_seconds != null && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {short.duration_seconds}s
                        </span>
                      )}
                      {short.published_at && (
                        <span>
                          {new Date(short.published_at).toLocaleDateString("pt-BR")}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex gap-1 flex-wrap">
                      {short.transcript && (
                        <Badge variant="outline" className="text-[10px]">Transcrito</Badge>
                      )}
                      {short.script_id && (
                        <Badge variant="outline" className="text-[10px]">Vinculado</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {shorts.data.total > PAGE_SIZE && (
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Pagina {page + 1} de {Math.ceil(shorts.data.total / PAGE_SIZE)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={(page + 1) * PAGE_SIZE >= shorts.data.total}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
