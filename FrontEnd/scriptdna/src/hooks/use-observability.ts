import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  AiCostSummary,
  AiAgentRun,
  HealthDetailedResponse,
} from "@/types/api";

export function useAiCosts(days = 30) {
  return useQuery({
    queryKey: ["ai-costs", days],
    queryFn: () =>
      api.get<AiCostSummary>(`/api/dashboard/ai-costs?days=${days}`),
    select: (res) => res.data,
  });
}

export function useAiRuns(params?: {
  limit?: number;
  agent?: string;
  status?: string;
}) {
  const query = new URLSearchParams();
  if (params?.limit) query.set("limit", String(params.limit));

  return useQuery({
    queryKey: ["ai-runs", params],
    queryFn: () =>
      api.get<AiAgentRun[]>(
        `/api/dashboard/ai-runs${query.toString() ? `?${query}` : ""}`
      ),
    select: (res) => res.data,
  });
}

export function useDetailedHealth() {
  return useQuery({
    queryKey: ["health-detailed"],
    queryFn: () => api.get<HealthDetailedResponse>("/health/detailed"),
    select: (res) => res.data,
    refetchInterval: 60_000,
  });
}
