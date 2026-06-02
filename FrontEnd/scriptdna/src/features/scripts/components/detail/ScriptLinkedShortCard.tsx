"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LinkButton } from "@/components/ui/link-button";
import { Link2, ExternalLink, Loader2, Video } from "lucide-react";
import { useLinkVideo } from "@/hooks/use-scripts";

interface ScriptLinkedShortCardProps {
  scriptId: string;
  youtubeVideoId: string | null;
}

export function ScriptLinkedShortCard({
  scriptId,
  youtubeVideoId,
}: ScriptLinkedShortCardProps) {
  const [open, setOpen] = useState(false);
  const [inputId, setInputId] = useState("");
  const linkVideo = useLinkVideo(scriptId);

  function handleLink() {
    if (!inputId.trim()) return;
    linkVideo.mutate(inputId.trim(), {
      onSuccess: () => {
        setOpen(false);
        setInputId("");
      },
    });
  }

  return (
    <Card data-testid="script-linked-short-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Video className="h-4 w-4" />
          Short vinculado
        </CardTitle>
      </CardHeader>
      <CardContent>
        {youtubeVideoId ? (
          <div className="space-y-3">
            <div className="rounded-md bg-accent p-3">
              <p className="text-xs text-muted-foreground mb-1">ID do vídeo</p>
              <p className="text-sm font-mono truncate">{youtubeVideoId}</p>
            </div>
            <div className="flex gap-2">
              <LinkButton
                href={`https://youtube.com/shorts/${youtubeVideoId}`}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <ExternalLink className="mr-2 h-3.5 w-3.5" />
                Ver no YouTube
              </LinkButton>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOpen(true)}
                data-testid="script-change-linked-btn"
              >
                Alterar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Vincule um Short para acompanhar o desempenho deste roteiro.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setOpen(true)}
              data-testid="script-link-btn"
            >
              <Link2 className="mr-2 h-4 w-4" />
              Vincular Short
            </Button>
          </div>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Vincular Short ao roteiro</DialogTitle>
            <DialogDescription>
              Cole o ID do vídeo do YouTube (ex: dQw4w9WgXcQ) para vincular este roteiro ao Short
              gravado.
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="ID do vídeo (ex: dQw4w9WgXcQ)"
            value={inputId}
            onChange={(e) => setInputId(e.target.value)}
            data-testid="script-link-input"
            onKeyDown={(e) => e.key === "Enter" && handleLink()}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={linkVideo.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleLink}
              disabled={!inputId.trim() || linkVideo.isPending}
              data-testid="script-link-confirm"
            >
              {linkVideo.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Link2 className="mr-2 h-4 w-4" />
              )}
              Vincular
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
