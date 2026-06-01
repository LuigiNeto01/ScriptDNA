import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  VideoSuggestion,
  SuggestionCategory,
  SuggestionStatus,
  PaginatedData,
} from "@/types/api";

export function useSuggestions(params?: {
  category?: SuggestionCategory;
  status?: SuggestionStatus;
  limit?: number;
  offset?: number;
}) {
  const query = new URLSearchParams();
  if (params?.category) query.set("category", params.category);
  if (params?.status) query.set("status", params.status);
  if (params?.limit) query.set("limit", String(params.limit));

  return useQuery({
    queryKey: ["suggestions", params],
    queryFn: () =>
      api.get<PaginatedData<VideoSuggestion>>(
        `/api/suggestions${query.toString() ? `?${query}` : ""}`
      ),
    select: (res) => res.data,
  });
}

export function useUpdateSuggestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: SuggestionStatus }) =>
      api.patch<VideoSuggestion>(`/api/suggestions/${id}?status=${status}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suggestions"] });
    },
  });
}

export function useConvertSuggestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post<{ script_id: string; version_id: string }>(
        `/api/suggestions/${id}/convert`
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suggestions"] });
      queryClient.invalidateQueries({ queryKey: ["scripts"] });
    },
  });
}

export function useGenerateSuggestions() {
  return useMutation({
    mutationFn: () => api.post<{ task_id: string }>("/api/suggestions/generate"),
  });
}
