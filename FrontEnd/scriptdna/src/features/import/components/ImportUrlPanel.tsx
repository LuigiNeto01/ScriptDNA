"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, Link as LinkIcon, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSubmitUrls } from "@/hooks/use-videos";
import { ImportTaskFeedback } from "./ImportTaskFeedback";

const urlSchema = z.object({
  creator_name: z.string().min(1, "Nome do criador obrigatorio"),
  niche: z.string().min(1, "Nicho obrigatorio"),
});

type UrlFormData = z.infer<typeof urlSchema>;
type UrlMeta = { url: string; valid: boolean };

function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export function ImportUrlPanel() {
  const [urls, setUrls] = useState<UrlMeta[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [taskIds, setTaskIds] = useState<string[]>([]);
  const submitUrls = useSubmitUrls();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UrlFormData>({ resolver: zodResolver(urlSchema) });

  function addUrls(raw: string) {
    const candidates = raw.split(/[\n\r,\s]+/).map((item) => item.trim()).filter(Boolean);
    if (candidates.length === 0) return;
    const existing = new Set(urls.map((entry) => entry.url));
    const next: UrlMeta[] = [];
    for (const candidate of candidates) {
      if (!existing.has(candidate)) {
        existing.add(candidate);
        next.push({ url: candidate, valid: isValidUrl(candidate) });
      }
    }
    if (next.length > 0) {
      setUrls((current) => [...current, ...next]);
      setUrlError(null);
    }
    setInputValue("");
  }

  const validUrls = urls.filter((entry) => entry.valid);
  const invalidCount = urls.length - validUrls.length;

  async function onSubmit(data: UrlFormData) {
    if (validUrls.length === 0) {
      setUrlError("Adicione pelo menos uma URL valida");
      return;
    }
    const results = await submitUrls.mutateAsync({
      urls: validUrls.map((entry) => entry.url),
      creator_name: data.creator_name,
      niche: data.niche,
    });
    setTaskIds(results.map((result) => result.data.task_id ?? result.data.video_id));
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="url-input">Links de referencia</Label>
          {urls.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {validUrls.length} valido{validUrls.length !== 1 ? "s" : ""}
              {invalidCount > 0 && <span className="ml-1 text-destructive">({invalidCount} invalido{invalidCount !== 1 ? "s" : ""})</span>}
            </span>
          )}
        </div>

        <div className="rounded-lg border bg-background p-2 focus-within:ring-2 focus-within:ring-ring">
          {urls.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {urls.map((entry, index) => (
                <span key={entry.url} className={`inline-flex max-w-[280px] items-center gap-1 rounded-md px-2 py-1 text-xs ${entry.valid ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
                  <LinkIcon className="h-3 w-3 shrink-0" />
                  <span className="truncate">{entry.url}</span>
                  <button type="button" onClick={() => setUrls((current) => current.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Remover ${entry.url}`}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <input
            id="url-input"
            type="text"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            placeholder={urls.length === 0 ? "Cole links e pressione Enter..." : "Adicionar mais links..."}
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === ",") {
                event.preventDefault();
                addUrls(inputValue);
              }
            }}
            onBlur={() => {
              if (inputValue.trim()) addUrls(inputValue);
            }}
            data-testid="url-input"
          />
        </div>

        {urlError && (
          <p className="flex items-center gap-1 text-xs text-destructive">
            <AlertCircle className="h-3 w-3" />
            {urlError}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="url-creator">Criador de referencia</Label>
          <Input id="url-creator" placeholder="Ex: Canal Exemplo" {...register("creator_name")} data-testid="url-creator-input" />
          {errors.creator_name && <p className="text-xs text-destructive">{errors.creator_name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="url-niche">Nicho</Label>
          <Input id="url-niche" placeholder="Ex: Educacao" {...register("niche")} data-testid="url-niche-input" />
          {errors.niche && <p className="text-xs text-destructive">{errors.niche.message}</p>}
        </div>
      </div>

      <Button type="submit" disabled={submitUrls.isPending || validUrls.length === 0} className="w-full" data-testid="url-submit-btn">
        {submitUrls.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LinkIcon className="h-4 w-4" />}
        Adicionar {validUrls.length > 0 ? `${validUrls.length} link${validUrls.length !== 1 ? "s" : ""}` : "links"} como referencia
      </Button>

      {taskIds.map((taskId) => (
        <ImportTaskFeedback key={taskId} taskId={taskId} />
      ))}
    </form>
  );
}
