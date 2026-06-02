import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  Script,
  ScriptAnalysis,
  ScriptLine,
  ScriptVersion,
  ScriptStatus,
} from "@/types/api";

export function useScripts(params?: {
  status?: ScriptStatus;
  niche?: string;
  theme?: string;
  q?: string;
  limit?: number;
  offset?: number;
}) {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.niche) query.set("niche", params.niche);
  if (params?.theme) query.set("theme", params.theme);
  if (params?.q) query.set("q", params.q);
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.offset) query.set("offset", String(params.offset));

  return useQuery({
    queryKey: ["scripts", params],
    queryFn: () =>
      api.get<Script[]>(`/api/scripts${query.toString() ? `?${query}` : ""}`),
    select: (res) => res.data,
  });
}

export function useScript(id: string) {
  return useQuery({
    queryKey: ["script", id],
    queryFn: () => api.get<Script>(`/api/scripts/${id}`),
    select: (res) => res.data,
    enabled: !!id,
  });
}

export function useScriptVersions(scriptId: string) {
  return useQuery({
    queryKey: ["script-versions", scriptId],
    queryFn: () => api.get<ScriptVersion[]>(`/api/scripts/${scriptId}/versions`),
    select: (res) => res.data,
    enabled: !!scriptId,
  });
}

export function useScriptVersion(scriptId: string, versionNumber: number) {
  return useQuery({
    queryKey: ["script-version", scriptId, versionNumber],
    queryFn: () =>
      api.get<ScriptVersion>(`/api/scripts/${scriptId}/versions/${versionNumber}`),
    select: (res) => res.data,
    enabled: !!scriptId && versionNumber > 0,
  });
}

export function useCompareVersions(scriptId: string, v1: number, v2: number) {
  return useQuery({
    queryKey: ["script-compare", scriptId, v1, v2],
    queryFn: () =>
      api.get<{ version_1: ScriptVersion; version_2: ScriptVersion }>(
        `/api/scripts/${scriptId}/compare?v1=${v1}&v2=${v2}`
      ),
    select: (res) => res.data,
    enabled: !!scriptId && v1 > 0 && v2 > 0 && v1 !== v2,
  });
}

export function useCreateScript() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      title: string;
      theme?: string;
      objective?: string;
      niche?: string;
      speaking_style?: string;
      estimated_duration_seconds?: number;
      hook?: string;
      cta?: string;
      lines?: ScriptLine[];
      analysis?: ScriptAnalysis;
      generation_params?: Record<string, unknown>;
    }) => api.post<{ script_id: string; version_id: string }>("/api/scripts", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scripts"] });
    },
  });
}

export function useCreateVersion(scriptId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      hook?: string;
      cta?: string;
      lines?: ScriptLine[];
      analysis?: ScriptAnalysis;
      change_summary?: string;
      created_by?: string;
    }) =>
      api.post<ScriptVersion>(`/api/scripts/${scriptId}/versions`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["script", scriptId] });
      queryClient.invalidateQueries({ queryKey: ["script-versions", scriptId] });
    },
  });
}

export function useUpdateScriptStatus(scriptId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (status: ScriptStatus) =>
      api.patch<Script>(`/api/scripts/${scriptId}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["script", scriptId] });
      queryClient.invalidateQueries({ queryKey: ["scripts"] });
    },
  });
}

export function useLinkVideo(scriptId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (youtubeVideoId: string) =>
      api.post<Script>(`/api/scripts/${scriptId}/link-video`, {
        youtube_video_id: youtubeVideoId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["script", scriptId] });
      queryClient.invalidateQueries({ queryKey: ["scripts"] });
    },
  });
}

export function useDeleteScript() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/scripts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scripts"] });
    },
  });
}
