import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  Video,
  VideoDetail,
  ScriptBeat,
  TranscriptSegment,
  TextVideoRequest,
  UrlVideoRequest,
  DashboardMetrics,
  SearchResult,
  TaskStatus,
  VideoCreateResponse,
} from "@/types/api";

export function useDashboardMetrics() {
  return useQuery({
    queryKey: ["dashboard-metrics"],
    queryFn: () => api.get<DashboardMetrics>("/api/dashboard/metrics"),
    select: (res) => res.data,
  });
}

export function useVideos(params?: {
  niche?: string;
  status?: string;
  page?: number;
}) {
  const query = new URLSearchParams();
  if (params?.niche) query.set("niche", params.niche);
  if (params?.status) query.set("status", params.status);
  if (params?.page) query.set("page", String(params.page));

  return useQuery({
    queryKey: ["videos", params],
    queryFn: () =>
      api.get<Video[]>(`/api/videos${query.toString() ? `?${query}` : ""}`),
  });
}

export function useVideo(id: string) {
  return useQuery({
    queryKey: ["video", id],
    queryFn: () => api.get<VideoDetail>(`/api/videos/${id}`),
    select: (res) => res.data,
    enabled: !!id,
  });
}

export function useVideoBeats(videoId: string) {
  return useQuery({
    queryKey: ["video-beats", videoId],
    queryFn: () => api.get<ScriptBeat[]>(`/api/videos/${videoId}/beats`),
    select: (res) => res.data,
    enabled: !!videoId,
  });
}

export function useVideoSegments(videoId: string) {
  return useQuery({
    queryKey: ["video-segments", videoId],
    queryFn: () =>
      api.get<TranscriptSegment[]>(`/api/videos/${videoId}/segments`),
    select: (res) => res.data,
    enabled: !!videoId,
  });
}

export function useUploadVideo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { file: File; creator_name: string; niche: string }) => {
      const formData = new FormData();
      formData.append("file", data.file);
      formData.append("title", data.file.name.replace(/\.[^/.]+$/, ""));
      formData.append("creator_name", data.creator_name);
      formData.append("niche", data.niche);
      return api.upload<VideoCreateResponse>(
        "/api/videos/upload",
        formData
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videos"] });
    },
  });
}

export function useSubmitText() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TextVideoRequest) =>
      api.post<VideoCreateResponse>("/api/videos/text", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videos"] });
    },
  });
}

export function useSubmitUrl() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UrlVideoRequest) =>
      api.post<VideoCreateResponse>("/api/videos/url", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videos"] });
    },
  });
}

export function useSubmitUrls() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      urls: string[];
      creator_name: string;
      niche: string;
    }) => {
      const requests = data.urls.map((url) =>
        api.post<VideoCreateResponse>("/api/videos/url", {
          url,
          creator_name: data.creator_name,
          niche: data.niche,
        })
      );

      return Promise.all(requests);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videos"] });
    },
  });
}

export function useTaskStatus(taskId: string | null) {
  return useQuery({
    queryKey: ["task", taskId],
    queryFn: () => api.get<TaskStatus>(`/api/tasks/${taskId}`),
    select: (res) => res.data,
    enabled: !!taskId,
    refetchInterval: (query) => {
      const status = query.state.data?.data?.status;
      if (
        status === "done" ||
        status === "error" ||
        status === "success" ||
        status === "failure"
      ) {
        return false;
      }
      return 2000;
    },
  });
}

export function useSearch(query: string) {
  return useQuery({
    queryKey: ["search", query],
    queryFn: () =>
      api.get<SearchResult[]>(
        `/api/search?q=${encodeURIComponent(query)}`
      ),
    enabled: query.length > 2,
  });
}

export function useRecentVideos() {
  return useQuery({
    queryKey: ["videos", "recent"],
    queryFn: () => api.get<Video[]>("/api/videos?sort=recent&limit=5"),
    select: (res) => res.data,
  });
}

export function useDeleteVideo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<{ deleted: boolean }>(`/api/videos/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videos"] });
    },
  });
}
