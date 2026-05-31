import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { StyleProfile, UpdateStyleRequest } from "@/types/api";

export function useStyles() {
  return useQuery({
    queryKey: ["styles"],
    queryFn: () => api.get<StyleProfile[]>("/api/styles"),
  });
}

export function useStyle(id: string) {
  return useQuery({
    queryKey: ["style", id],
    queryFn: () => api.get<StyleProfile>(`/api/styles/${id}`),
    select: (res) => res.data,
    enabled: !!id,
  });
}

export function useGenerateStyle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { video_ids: string[]; name: string }) =>
      api.post<StyleProfile>("/api/styles/generate", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["styles"] });
    },
  });
}

export function useUpdateStyle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateStyleRequest & { id: string }) =>
      api.patch<StyleProfile>(`/api/styles/${id}`, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["styles"] });
      queryClient.invalidateQueries({ queryKey: ["style", variables.id] });
    },
  });
}

export function useDeleteStyle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete<{ deleted: boolean }>(`/api/styles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["styles"] });
    },
  });
}
