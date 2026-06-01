import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  ChannelInsight,
  InsightCategory,
  InsightSentiment,
  PaginatedData,
} from "@/types/api";

export function useInsights(params?: {
  category?: InsightCategory;
  sentiment?: InsightSentiment;
  niche?: string;
  active_only?: boolean;
  limit?: number;
  offset?: number;
}) {
  const query = new URLSearchParams();
  if (params?.category) query.set("category", params.category);
  if (params?.sentiment) query.set("sentiment", params.sentiment);
  if (params?.niche) query.set("niche", params.niche);
  if (params?.active_only !== undefined) query.set("active_only", String(params.active_only));
  if (params?.limit) query.set("limit", String(params.limit));

  return useQuery({
    queryKey: ["insights", params],
    queryFn: () =>
      api.get<PaginatedData<ChannelInsight>>(
        `/api/insights${query.toString() ? `?${query}` : ""}`
      ),
    select: (res) => res.data,
  });
}

export function useInsight(id: string) {
  return useQuery({
    queryKey: ["insight", id],
    queryFn: () => api.get<ChannelInsight>(`/api/insights/${id}`),
    select: (res) => res.data,
    enabled: !!id,
  });
}

export function useToggleInsight() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      api.patch<ChannelInsight>(`/api/insights/${id}?is_active=${is_active}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["insights"] });
    },
  });
}

export function useGenerateInsights() {
  return useMutation({
    mutationFn: () => api.post<{ task_id: string }>("/api/insights/generate"),
  });
}
