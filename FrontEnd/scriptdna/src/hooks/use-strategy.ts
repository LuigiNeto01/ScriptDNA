import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { InternalTrend, TitleSuggestion, ThumbnailIdea } from "@/types/api";

export function useInternalTrends() {
  return useQuery({
    queryKey: ["strategy-trends"],
    queryFn: () => api.get<InternalTrend[]>("/api/strategy/trends"),
    select: (res) => res.data,
  });
}

export function useGenerateWeeklyStrategy() {
  return useMutation({
    mutationFn: () =>
      api.post<{ task_id: string }>("/api/strategy/weekly"),
  });
}

export function useGenerateTitles() {
  return useMutation({
    mutationFn: (data: {
      theme: string;
      niche?: string;
      count?: number;
      style_profile_id?: string;
    }) => api.post<{ titles: TitleSuggestion[] }>("/api/generate/titles", data),
  });
}

export function useGenerateThumbnailIdeas() {
  return useMutation({
    mutationFn: (data: {
      theme: string;
      title?: string;
      niche?: string;
      count?: number;
    }) => api.post<{ ideas: ThumbnailIdea[] }>("/api/generate/thumbnail-ideas", data),
  });
}
