"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { useVideos, useSearch, useDeleteVideo } from "@/hooks/use-videos";
import {
  Search,
  LayoutGrid,
  List,
  Loader2,
  AlertCircle,
  Video,
  Clock,
  Filter,
  Trash2,
} from "lucide-react";
import { Label } from "@/components/ui/label";

function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null) return "—";
  const min = Math.floor(seconds / 60);
  const sec = Math.round(seconds % 60);
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

export default function LibraryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [nicheFilter, setNicheFilter] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const videos = useVideos({
    niche: nicheFilter || undefined,
  });
  const searchResults = useSearch(searchQuery);
  const deleteMutation = useDeleteVideo();

  const isSearching = searchQuery.length > 2;
  const displayData = isSearching
    ? searchResults.data?.data?.map((r) => r.video)
    : videos.data?.data;
  const isLoading = isSearching ? searchResults.isLoading : videos.isLoading;
  const isError = isSearching ? searchResults.isError : videos.isError;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Biblioteca</h1>
          <p className="text-muted-foreground">
            Todos os vídeos e roteiros analisados
          </p>
        </div>
        <div className="flex gap-1">
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="icon"
            onClick={() => setViewMode("grid")}
            aria-label="Visualização em grade"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="icon"
            onClick={() => setViewMode("list")}
            aria-label="Visualização em lista"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-[250px]">
          <Label htmlFor="search-input" className="sr-only">
            Busca semântica
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search-input"
              placeholder="Busca semântica... (ex: 'hooks que criam urgência')"
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="search-input"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filtrar por nicho"
            className="w-40"
            value={nicheFilter}
            onChange={(e) => setNicheFilter(e.target.value)}
            data-testid="niche-filter"
          />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <div className="flex items-center gap-2 text-destructive py-8 justify-center">
          <AlertCircle className="h-5 w-5" />
          <span>Erro ao carregar biblioteca</span>
        </div>
      ) : !displayData?.length ? (
        <EmptyState
          icon={Video}
          title={isSearching ? "Nenhum resultado" : "Biblioteca vazia"}
          description={
            isSearching
              ? "Tente outra busca ou filtro."
              : "Importe vídeos para começar a construir sua biblioteca."
          }
          action={
            !isSearching ? (
              <LinkButton href="/import">Importar Vídeo</LinkButton>
            ) : undefined
          }
        />
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayData.map((video) => (
            <Link
              key={video.id}
              href={`/videos/${video.id}`}
              data-testid="video-card"
            >
              <Card className="hover:border-primary/50 transition-colors h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base line-clamp-2">
                      {video.title}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={video.status} />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (confirm("Tem certeza que deseja apagar este vídeo?")) {
                            deleteMutation.mutate(video.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span>{video.creator_name ?? "Criador não informado"}</span>
                    <span>&middot;</span>
                    <Badge variant="outline" className="text-xs">
                      {video.niche ?? "Sem nicho"}
                    </Badge>
                    <span className="flex items-center gap-1 ml-auto">
                      <Clock className="h-3 w-3" />
                      {formatDuration(video.duration_seconds)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {displayData.map((video) => (
            <Link
              key={video.id}
              href={`/videos/${video.id}`}
              className="flex flex-col gap-3 rounded-lg border p-3 transition-colors hover:bg-accent sm:flex-row sm:items-center sm:justify-between"
              data-testid="video-list-item"
            >
              <div className="flex flex-col gap-1">
                <span className="font-medium text-sm">{video.title}</span>
                <div className="flex gap-2 text-xs text-muted-foreground">
                  <span>{video.creator_name ?? "Criador não informado"}</span>
                  <span>&middot;</span>
                  <span>{video.niche ?? "Sem nicho"}</span>
                  <span>&middot;</span>
                  <span>{formatDuration(video.duration_seconds)}</span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <StatusBadge status={video.status} />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (confirm("Tem certeza que deseja apagar este vídeo?")) {
                      deleteMutation.mutate(video.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
