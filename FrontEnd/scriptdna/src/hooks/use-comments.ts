import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { YouTubeShortComment, CommentSummary } from "@/types/api";

export function useComments(shortId: string, params?: { sentiment?: string; intent?: string; limit?: number }) {
  const query = new URLSearchParams();
  if (params?.sentiment) query.set("sentiment", params.sentiment);
  if (params?.intent) query.set("intent", params.intent);
  if (params?.limit) query.set("limit", String(params.limit));

  return useQuery({
    queryKey: ["comments", shortId, params],
    queryFn: () =>
      api.get<YouTubeShortComment[]>(
        `/api/comments/short/${shortId}${query.toString() ? `?${query}` : ""}`
      ),
    select: (res) => res.data,
    enabled: !!shortId,
  });
}

export function useCommentSummary(shortId: string) {
  return useQuery({
    queryKey: ["comment-summary", shortId],
    queryFn: () =>
      api.get<CommentSummary>(`/api/comments/short/${shortId}/summary`),
    select: (res) => res.data,
    enabled: !!shortId,
  });
}

export function useFetchComments(shortId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api.post<{ task_id: string }>(`/api/comments/short/${shortId}/fetch`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", shortId] });
      queryClient.invalidateQueries({ queryKey: ["comment-summary", shortId] });
    },
  });
}

export function useAnalyzeComments(shortId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api.post<{ task_id: string }>(`/api/comments/short/${shortId}/analyze`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", shortId] });
      queryClient.invalidateQueries({ queryKey: ["comment-summary", shortId] });
    },
  });
}
