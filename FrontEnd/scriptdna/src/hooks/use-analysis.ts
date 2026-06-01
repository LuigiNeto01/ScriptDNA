import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { PerformanceAnalysis } from "@/types/api";

export function usePerformanceAnalysis(shortId: string) {
  return useQuery({
    queryKey: ["performance-analysis", shortId],
    queryFn: () =>
      api.get<PerformanceAnalysis | null>(`/api/analysis/performance/${shortId}`),
    select: (res) => res.data,
    enabled: !!shortId,
  });
}

export function useAnalyzePerformance() {
  return useMutation({
    mutationFn: (shortId: string) =>
      api.post<{ task_id: string }>(`/api/analysis/performance/${shortId}`),
  });
}

export function useAnalyzeChannel() {
  return useMutation({
    mutationFn: () => api.post<{ task_id: string }>("/api/analysis/channel"),
  });
}

export function useIdentifyPatterns() {
  return useMutation({
    mutationFn: () => api.post<{ task_id: string }>("/api/analysis/patterns"),
  });
}
