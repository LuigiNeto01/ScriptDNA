"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSubmitText } from "@/hooks/use-videos";
import { FileText, Loader2 } from "lucide-react";
import { ImportTaskFeedback } from "./ImportTaskFeedback";

const textSchema = z.object({
  title: z.string().min(1, "Titulo obrigatorio"),
  text: z.string().min(10, "Texto deve ter pelo menos 10 caracteres"),
  creator_name: z.string().min(1, "Nome do criador obrigatorio"),
  niche: z.string().min(1, "Nicho obrigatorio"),
});

type TextFormData = z.infer<typeof textSchema>;

export function ImportTextPanel() {
  const [taskId, setTaskId] = useState<string | null>(null);
  const submitText = useSubmitText();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TextFormData>({ resolver: zodResolver(textSchema) });

  async function onSubmit(data: TextFormData) {
    const result = await submitText.mutateAsync(data);
    setTaskId(result.data.task_id ?? result.data.video_id);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="text-title">Titulo da referencia</Label>
        <Input id="text-title" placeholder="Ex: Gancho sobre rotina de estudos" {...register("title")} data-testid="text-title-input" />
        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="text-content">Roteiro ou transcricao</Label>
        <Textarea id="text-content" placeholder="Cole o texto que a IA deve estudar..." rows={8} {...register("text")} data-testid="text-content-input" />
        {errors.text && <p className="text-xs text-destructive">{errors.text.message}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="text-creator">Criador de referencia</Label>
          <Input id="text-creator" placeholder="Ex: Canal Exemplo" {...register("creator_name")} data-testid="text-creator-input" />
          {errors.creator_name && <p className="text-xs text-destructive">{errors.creator_name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="text-niche">Nicho</Label>
          <Input id="text-niche" placeholder="Ex: Educacao" {...register("niche")} data-testid="text-niche-input" />
          {errors.niche && <p className="text-xs text-destructive">{errors.niche.message}</p>}
        </div>
      </div>

      <Button type="submit" disabled={submitText.isPending} className="w-full" data-testid="text-submit-btn">
        {submitText.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
        Adicionar texto como referencia
      </Button>

      {taskId && <ImportTaskFeedback taskId={taskId} />}
    </form>
  );
}
