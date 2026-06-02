"use client";

import { useState } from "react";
import { PageLoading } from "@/components/feedback/page-loading";
import { Card, CardContent } from "@/components/ui/card";
import { LibraryFilterBar } from "@/features/library/components/LibraryFilterBar";
import { LibraryPageHeader } from "@/features/library/components/LibraryPageHeader";
import { ReferenceEmptyState } from "@/features/library/components/ReferenceEmptyState";
import { ReferenceSearchPanel } from "@/features/library/components/ReferenceSearchPanel";
import { ReferenceVideoCard } from "@/features/library/components/ReferenceVideoCard";
import { useDeleteVideo, useSearch, useVideos } from "@/hooks/use-videos";
import { AlertCircle } from "lucide-react";

export default function LibraryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [nicheFilter, setNicheFilter] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const videos = useVideos({ niche: nicheFilter || undefined });
  const searchResults = useSearch(searchQuery);
  const deleteMutation = useDeleteVideo();

  const isSearching = searchQuery.length > 2;
  const displayData = isSearching
    ? searchResults.data?.data?.map((result) => result.video)
    : videos.data?.data;
  const isLoading = isSearching ? searchResults.isLoading : videos.isLoading;
  const isError = isSearching ? searchResults.isError : videos.isError;

  return (
    <div className="space-y-6">
      <LibraryPageHeader viewMode={viewMode} onViewModeChange={setViewMode} />

      <ReferenceSearchPanel isSearching={isSearching} />

      <LibraryFilterBar
        searchQuery={searchQuery}
        nicheFilter={nicheFilter}
        onSearchChange={setSearchQuery}
        onNicheChange={setNicheFilter}
      />

      {isLoading ? (
        <PageLoading message="Carregando suas referencias..." />
      ) : isError ? (
        <Card>
          <CardContent className="flex items-center gap-2 py-6 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span>
              Nao conseguimos carregar esses dados agora. Tente novamente em alguns instantes.
            </span>
          </CardContent>
        </Card>
      ) : !displayData?.length ? (
        <ReferenceEmptyState isSearching={isSearching} />
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayData.map((video) => (
            <ReferenceVideoCard
              key={video.id}
              video={video}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {displayData.map((video) => (
            <ReferenceVideoCard
              key={video.id}
              video={video}
              variant="list"
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
