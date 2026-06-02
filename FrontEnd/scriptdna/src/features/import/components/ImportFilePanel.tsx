"use client";

import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { AlertCircle, FileText, Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUploadVideo } from "@/hooks/use-videos";
import { ImportTaskFeedback } from "./ImportTaskFeedback";

const ACCEPTED_FILES = {
  "text/plain": [".txt"],
  "video/mp4": [".mp4"],
  "audio/mpeg": [".mp3"],
  "audio/wav": [".wav"],
};

const MAX_FILE_SIZE = 25 * 1024 * 1024;

export function ImportFilePanel() {
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
        setFileError(err.code === "file-too-large" ? "Arquivo acima de 25MB. Envie um arquivo menor ou o audio separado." : "Formato de arquivo nao suportado.");
        return;
      }
      setFile(accepted[0]);
      setFileError(null);
    },
  });

  async function handleSubmit() {
    if (!file || !creatorName || !niche) return;
    const result = await uploadMutation.mutateAsync({
      file,
      creator_name: creatorName,
      niche,
    });
    setTaskId(result.data.task_id ?? result.data.video_id);
  }

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
        data-testid="file-dropzone"
      >
        <input {...getInputProps()} />
        {file ? (
          <div className="flex items-center justify-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">{file.name}</span>
            <button
              onClick={(event) => {
                event.stopPropagation();
                setFile(null);
              }}
              aria-label="Remover arquivo"
            >
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          </div>
        ) : (
          <>
            <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Arraste um arquivo ou clique para selecionar</p>
            <p className="mt-1 text-xs text-muted-foreground">.txt, .mp4, .mp3, .wav (max 25MB)</p>
          </>
        )}
      </div>

      {fileError && (
        <p className="flex items-center gap-1 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {fileError}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="file-creator">Criador de referencia</Label>
          <Input id="file-creator" placeholder="Ex: Canal Exemplo" value={creatorName} onChange={(event) => setCreatorName(event.target.value)} data-testid="file-creator-input" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="file-niche">Nicho</Label>
          <Input id="file-niche" placeholder="Ex: Educacao" value={niche} onChange={(event) => setNiche(event.target.value)} data-testid="file-niche-input" />
        </div>
      </div>

      <Button onClick={handleSubmit} disabled={!file || !creatorName || !niche || uploadMutation.isPending} className="w-full" data-testid="file-submit-btn">
        {uploadMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        Adicionar arquivo como referencia
      </Button>

      {taskId && <ImportTaskFeedback taskId={taskId} />}
    </div>
  );
}
