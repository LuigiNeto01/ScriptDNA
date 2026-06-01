import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  YouTubeChannel,
  YouTubeShort,
  ShortMetrics,
  MetricsHistoryEntry,
  PaginatedData,
} from "@/types/api";

export function useYouTubeChannel() {
  return useQuery({
    queryKey: ["youtube-channel"],
    queryFn: () => api.get<YouTubeChannel>("/api/youtube/channel"),
    select: (res) => res.data,
  });
}

export function useConnectYouTube() {
  return useMutation({
    mutationFn: () =>
      api.get<{ authorization_url: string }>("/api/auth/youtube/connect"),
  });
}

export function useYouTubeShorts(params?: { limit?: number; offset?: number }) {
  const query = new URLSearchParams();
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.offset) query.set("offset", String(params.offset));

  return useQuery({
    queryKey: ["youtube-shorts", params],
    queryFn: () =>
      api.get<PaginatedData<YouTubeShort>>(
        `/api/youtube/shorts${query.toString() ? `?${query}` : ""}`
      ),
    select: (res) => res.data,
  });
}

export function useYouTubeShort(id: string) {
  return useQuery({
    queryKey: ["youtube-short", id],
    queryFn: () => api.get<YouTubeShort>(`/api/youtube/shorts/${id}`),
    select: (res) => res.data,
    enabled: !!id,
  });
}

export function useShortMetrics(shortId: string) {
  return useQuery({
    queryKey: ["short-metrics", shortId],
    queryFn: () => api.get<ShortMetrics | null>(`/api/youtube/shorts/${shortId}/metrics`),
    select: (res) => res.data,
    enabled: !!shortId,
  });
}

export function useMetricsHistory(shortId: string) {
  return useQuery({
    queryKey: ["metrics-history", shortId],
    queryFn: () =>
      api.get<MetricsHistoryEntry[]>(`/api/youtube/shorts/${shortId}/metrics/history`),
    select: (res) => res.data,
    enabled: !!shortId,
  });
}

export function useSyncShorts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<{ task_id: string }>("/api/youtube/sync"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["youtube-shorts"] });
    },
  });
}

export function useFetchMetrics() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (shortId: string) =>
      api.post<{ task_id: string }>(`/api/youtube/shorts/${shortId}/fetch-metrics`),
    onSuccess: (_, shortId) => {
      queryClient.invalidateQueries({ queryKey: ["short-metrics", shortId] });
    },
  });
}

export function useFetchTranscript() {
  return useMutation({
    mutationFn: (shortId: string) =>
      api.post<{ task_id: string }>(`/api/youtube/shorts/${shortId}/fetch-transcript`),
  });
}

export function useSubmitManualMetrics() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      youtube_short_id: string;
      views: number;
      likes?: number;
      comments?: number;
      shares?: number;
      subscribers_gained?: number;
      average_view_duration_seconds?: number;
      average_view_percentage?: number;
      impressions?: number;
      impressions_ctr?: number;
      published_at?: string;
    }) => api.post<ShortMetrics>("/api/youtube/metrics/manual", data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["short-metrics", variables.youtube_short_id],
      });
    },
  });
}
