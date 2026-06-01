import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  GenerateScriptRequest,
  GenerateScriptResponse,
  ImprovedScript,
  ImproveScriptRequest,
  GenerateHooksRequest,
} from "@/types/api";

export function useGenerateScript() {
  return useMutation({
    mutationFn: (data: GenerateScriptRequest) =>
      api.post<GenerateScriptResponse>("/api/generate/script", data),
  });
}

export function useImproveScript() {
  return useMutation({
    mutationFn: (data: ImproveScriptRequest) =>
      api.post<ImprovedScript>("/api/generate/improve", data),
  });
}

export function useGenerateHooks() {
  return useMutation({
    mutationFn: (data: GenerateHooksRequest) =>
      api.post<{ hooks: string[] }>("/api/generate/hooks", data),
  });
}
