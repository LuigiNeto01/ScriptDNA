import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ScriptExperiment } from "@/types/api";

export function useExperiments() {
  return useQuery({
    queryKey: ["experiments"],
    queryFn: () => api.get<ScriptExperiment[]>("/api/experiments"),
    select: (res) => res.data,
  });
}

export function useExperiment(id: string) {
  return useQuery({
    queryKey: ["experiments", id],
    queryFn: () => api.get<ScriptExperiment>(`/api/experiments/${id}`),
    select: (res) => res.data,
    enabled: !!id,
  });
}

export function useCreateExperiment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; hypothesis?: string; variant_a_script_id?: string; variant_b_script_id?: string }) =>
      api.post<ScriptExperiment>("/api/experiments", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["experiments"] });
    },
  });
}

export function useUpdateExperiment(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ScriptExperiment>) =>
      api.patch<ScriptExperiment>(`/api/experiments/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["experiments"] });
      queryClient.invalidateQueries({ queryKey: ["experiments", id] });
    },
  });
}

export function useCompleteExperiment(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { winner: "a" | "b" | "tie"; result_summary?: string }) =>
      api.post<ScriptExperiment>(`/api/experiments/${id}/complete`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["experiments"] });
      queryClient.invalidateQueries({ queryKey: ["experiments", id] });
    },
  });
}
