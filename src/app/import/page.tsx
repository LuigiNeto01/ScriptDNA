"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  useUploadVideo,
  useSubmitText,
  useSubmitUrls,
  useTaskStatus,
} from "@/hooks/use-videos";
import {
  FileText,
  Upload,
  Link as LinkIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
} from "lucide-react";

const ACCEPTED_FILES = {
  "text/plain": [".txt"],
  "video/mp4": [".mp4"],
  "audio/mpeg": [".mp3"],
  "audio/wav": [".wav"],
};

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

const textSchema = z.object({
  title: z.string().min(1, "Título obrigatório"),
  text: z.string().min(10, "Texto deve ter pelo menos 10 caracteres"),
  creator_name: z.string().min(1, "Nome do criador obrigatório"),
  niche: z.string().min(1, "Nicho obrigatório"),
});

const urlSchema = z.object({
  creator_name: z.string().min(1, "Nome do criador obrigatório"),
  niche: z.string().min(1, "Nicho obrigatório"),
});

type TextFormData = z.infer<typeof textSchema>;
type UrlFormData = z.infer<typeof urlSchema>;
type UrlMeta = { url: string; valid: boolean };

const processingSteps = [
  { key: "transcribing", label: "Transcrevendo", progress: 25 },
  { key: "analyzing", label: "Analisando", progress: 50 },
  { key: "embedding", label: "Gerando embeddings", progress: 75 },
  { key: "done", label: "Concluído", progress: 100 },
];

function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function ProcessingStatus({ taskId }: { taskId: string }) {
  const { data: task } = useTaskStatus(taskId);
  const currentStep = task?.current_step ?? "pending";
  const stepIndex = processingSteps.findIndex((s) => s.key === currentStep);
  const progress = stepIndex >= 0 ? processingSteps[stepIndex].progress : 10;
  const failed = task?.status === "error" || task?.status === "failure";
  const completed = task?.status === "done" || task?.status === "success";

  if (failed) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg border border-destructive p-4"
      >
        <div className="flex items-center gap-2 text-destructive mb-2">
          <AlertCircle className="h-5 w-5" />
          <span className="font-medium">Erro no processamento</span>

        </div>
        <p className="text-sm text-muted-foreground">
          {task.error ?? "Erro desconhecido. Tente novamente."}
        </p>
      </motion.div>
    );
  }

  if (completed) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg border border-green-500/30 bg-green-500/5 p-4"
      >
        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
          <CheckCircle2 className="h-5 w-5" />
          <span className="font-medium">Processamento concluído!</span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 rounded-lg border p-4"
    >
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm font-medium">Processando...</span>
      </div>
      <Progress value={progress} className="h-2" />
      <div className="flex gap-2 flex-wrap">
        {processingSteps.map((step, i) => (
          <span
            key={step.key}
            className={`text-xs px-2 py-1 rounded-full ${
              i <= stepIndex
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {step.label}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

function FileUploadTab() {
  const [file, setFile] = useState<File | null>(null);
  const [creatorName, setCreatorName] = useState("");
  const [niche, setNiche] = useState("");
  const [fileError, setFileError] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);

  const uploadMutation = useUploadVideo();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: ACCEPTED_FILES,
    maxSize: MAX_FILE_SIZE,
    maxFiles: 1,
    onDrop: (accepted, rejected) => {
      if (rejected.length > 0) {
        const err = rejected[0].errors[0];
        if (err.code === "file-too-large") {
          setFileError("Arquivo acima de 25MB — envie o áudio separado");
        } else {
          setFileError("Formato de arquivo não suportado");
        }
        return;
      }
      setFile(accepted[0]);
      setFileError(null);
    },
  });

  const handleSubmit = async () => {
    if (!file || !creatorName || !niche) return;
    const result = await uploadMutation.mutateAsync({
      file,
      creator_name: creatorName,
      niche,
    });
    setTaskId(result.data.task_id ?? result.data.video_id);
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50"
        }`}
        data-testid="file-dropzone"
      >
        <input {...getInputProps()} />
        {file ? (
          <div className="flex items-center justify-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">{file.name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
              }}
              aria-label="Remover arquivo"
            >
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          </div>
        ) : (
          <>
            <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Arraste um arquivo ou clique para selecionar
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              .txt, .mp4, .mp3, .wav (max 25MB)
            </p>
          </>
        )}
      </div>

      {fileError && (
        <p className="text-sm text-destructive flex items-center gap-1">
          <AlertCircle className="h-4 w-4" />
          {fileError}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="file-creator">Criador de referência</Label>
          <Input
            id="file-creator"
            placeholder="Ex: MrBeast"
            value={creatorName}
            onChange={(e) => setCreatorName(e.target.value)}
            data-testid="file-creator-input"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="file-niche">Nicho</Label>
          <Input
            id="file-niche"
            placeholder="Ex: Educação, Entretenimento"
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            data-testid="file-niche-input"
          />
        </div>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!file || !creatorName || !niche || uploadMutation.isPending}
        className="w-full"
        data-testid="file-submit-btn"
      >
        {uploadMutation.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Upload className="h-4 w-4 mr-2" />
        )}
        Enviar Arquivo
      </Button>

      <AnimatePresence>
        {taskId && <ProcessingStatus taskId={taskId} />}
      </AnimatePresence>
    </div>
  );
}

function TextTab() {
  const [taskId, setTaskId] = useState<string | null>(null);
  const submitText = useSubmitText();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TextFormData>({
    resolver: zodResolver(textSchema),
  });

  const onSubmit = async (data: TextFormData) => {
    const result = await submitText.mutateAsync(data);
    setTaskId(result.data.task_id ?? result.data.video_id);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="text-title">Título</Label>
        <Input
          id="text-title"
          placeholder="Título do roteiro"
          {...register("title")}
          data-testid="text-title-input"
        />
        {errors.title && (
          <p className="text-xs text-destructive">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="text-content">Texto do Roteiro</Label>
        <Textarea
          id="text-content"
          placeholder="Cole o texto do roteiro aqui..."
          rows={8}
          {...register("text")}
          data-testid="text-content-input"
        />
        {errors.text && (
          <p className="text-xs text-destructive">{errors.text.message}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="text-creator">Criador de referência</Label>
          <Input
            id="text-creator"
            placeholder="Ex: MrBeast"
            {...register("creator_name")}
            data-testid="text-creator-input"
          />
          {errors.creator_name && (
            <p className="text-xs text-destructive">
              {errors.creator_name.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="text-niche">Nicho</Label>
          <Input
            id="text-niche"
            placeholder="Ex: Educação"
            {...register("niche")}
            data-testid="text-niche-input"
          />
          {errors.niche && (
            <p className="text-xs text-destructive">{errors.niche.message}</p>
          )}
        </div>
      </div>

      <Button
        type="submit"
        disabled={submitText.isPending}
        className="w-full"
        data-testid="text-submit-btn"
      >
        {submitText.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <FileText className="h-4 w-4 mr-2" />
        )}
        Enviar Texto
      </Button>

      <AnimatePresence>
        {taskId && <ProcessingStatus taskId={taskId} />}
      </AnimatePresence>
    </form>
  );
}

function UrlTab() {
  const [urls, setUrls] = useState<UrlMeta[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [taskIds, setTaskIds] = useState<string[]>([]);
  const submitUrls = useSubmitUrls();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UrlFormData>({
    resolver: zodResolver(urlSchema),
  });

  const addUrls = (raw: string) => {
    const candidates = raw
      .split(/[\n\r,\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (candidates.length === 0) return;

    const existing = new Set(urls.map((u) => u.url));
    const newUrls: UrlMeta[] = [];
    for (const candidate of candidates) {
      if (!existing.has(candidate)) {
        existing.add(candidate);
        newUrls.push({ url: candidate, valid: isValidUrl(candidate) });
      }
    }
    if (newUrls.length > 0) {
      setUrls((prev) => [...prev, ...newUrls]);
      setUrlError(null);
    }
    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addUrls(inputValue);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text");
    if (pasted.includes("\n") || pasted.includes(",") || pasted.includes(" ")) {
      e.preventDefault();
      addUrls(pasted);
    }
  };

  const removeUrl = (index: number) => {
    setUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setUrls([]);
    setUrlError(null);
  };

  const validUrls = urls.filter((u) => u.valid);
  const invalidCount = urls.length - validUrls.length;

  const onSubmit = async (data: UrlFormData) => {
    if (validUrls.length === 0) {
      setUrlError("Adicione pelo menos uma URL válida");
      return;
    }
    const results = await submitUrls.mutateAsync({
      urls: validUrls.map((u) => u.url),
      creator_name: data.creator_name,
      niche: data.niche,
    });
    setTaskIds(results.map((result) => result.data.task_id ?? result.data.video_id));
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="url-input">Links dos Vídeos</Label>
          {urls.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {validUrls.length} link{validUrls.length !== 1 ? "s" : ""}
              {invalidCount > 0 && (
                <span className="text-destructive ml-1">
                  ({invalidCount} inválido{invalidCount !== 1 ? "s" : ""})
                </span>
              )}
            </span>
          )}
        </div>

        <div
          className="rounded-lg border bg-background p-2 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background transition-shadow"
        >
          <AnimatePresence mode="popLayout">
            {urls.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {urls.map((entry, i) => (
                  <motion.span
                    key={entry.url}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.15 }}
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-mono max-w-[280px] group ${
                      entry.valid
                        ? "bg-primary/10 text-primary"
                        : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    <LinkIcon className="h-3 w-3 shrink-0" />
                    <span className="truncate">{entry.url}</span>
                    <button
                      type="button"
                      onClick={() => removeUrl(i)}
                      className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
                      aria-label={`Remover ${entry.url}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </motion.span>
                ))}
              </div>
            )}
          </AnimatePresence>

          <input
            id="url-input"
            type="text"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            placeholder={
              urls.length === 0
                ? "Cole ou digite URLs e pressione Enter..."
                : "Adicionar mais URLs..."
            }
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onBlur={() => {
              if (inputValue.trim()) addUrls(inputValue);
            }}
            data-testid="url-input"
          />
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Separe por Enter, virgula ou cole varias de uma vez
          </p>
          {urls.length > 1 && (
            <button
              type="button"
              onClick={clearAll}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Limpar tudo
            </button>
          )}
        </div>

        {urlError && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {urlError}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="url-creator">Criador de referência</Label>
          <Input
            id="url-creator"
            placeholder="Ex: MrBeast"
            {...register("creator_name")}
            data-testid="url-creator-input"
          />
          {errors.creator_name && (
            <p className="text-xs text-destructive">
              {errors.creator_name.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="url-niche">Nicho</Label>
          <Input
            id="url-niche"
            placeholder="Ex: Educação"
            {...register("niche")}
            data-testid="url-niche-input"
          />
          {errors.niche && (
            <p className="text-xs text-destructive">{errors.niche.message}</p>
          )}
        </div>
      </div>

      <Button
        type="submit"
        disabled={submitUrls.isPending || validUrls.length === 0}
        className="w-full"
        data-testid="url-submit-btn"
      >
        {submitUrls.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <LinkIcon className="h-4 w-4 mr-2" />
        )}
        Importar {validUrls.length > 0 ? `${validUrls.length} Link${validUrls.length !== 1 ? "s" : ""}` : "Links"}
      </Button>

      <AnimatePresence>
        {taskIds.map((taskId) => (
          <ProcessingStatus key={taskId} taskId={taskId} />
        ))}
      </AnimatePresence>
    </form>
  );
}

export default function ImportPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Importar</h1>
        <p className="text-muted-foreground">
          Adicione um vídeo ou roteiro para análise
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fonte de Entrada</CardTitle>
          <CardDescription>
            Escolha como deseja adicionar o conteúdo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="text">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="text" data-testid="tab-text">
                <FileText className="h-4 w-4 mr-2" />
                Texto
              </TabsTrigger>
              <TabsTrigger value="file" data-testid="tab-file">
                <Upload className="h-4 w-4 mr-2" />
                Arquivo
              </TabsTrigger>
              <TabsTrigger value="url" data-testid="tab-url">
                <LinkIcon className="h-4 w-4 mr-2" />
                Link
              </TabsTrigger>
            </TabsList>

            <TabsContent value="text" className="mt-4">
              <TextTab />
            </TabsContent>
            <TabsContent value="file" className="mt-4">
              <FileUploadTab />
            </TabsContent>
            <TabsContent value="url" className="mt-4">
              <UrlTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
