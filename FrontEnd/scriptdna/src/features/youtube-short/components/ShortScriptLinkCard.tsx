"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LinkScriptDialog } from "@/features/youtube-short/components/LinkScriptDialog";
import { useLinkShortScript, useUnlinkShortScript } from "@/hooks/use-youtube";
import { formatScriptStatus } from "@/lib/formatters";
import { ExternalLink, Link2, Loader2, Unlink } from "lucide-react";
import type { YouTubeShort } from "@/types/api";

export function ShortScriptLinkCard({ short }: { short: YouTubeShort }) {
  const [open, setOpen] = useState(false);
  const linkScript = useLinkShortScript(short.id);
  const unlinkScript = useUnlinkShortScript(short.id);
  const linkedScript = short.script_link;

  const isPending = linkScript.isPending || unlinkScript.isPending;

  function handleLink(scriptId: string) {
    linkScript.mutate(scriptId, {
      onSuccess: () => setOpen(false),
    });
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Link2 className="h-4 w-4" />
            Roteiro vinculado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {linkedScript ? (
            <>
              <div className="rounded-md border bg-accent/40 p-3">
                <p className="text-sm font-medium">{linkedScript.script_title}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-[10px]">
                    {formatScriptStatus(linkedScript.script_status ?? "draft")}
                  </Badge>
                  <span>ID do video: {short.youtube_video_id}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Link href={`/scripts/${linkedScript.script_id}`} className="flex-1">
                  <Button variant="outline" className="w-full" size="sm">
                    <ExternalLink className="h-4 w-4" />
                    Abrir roteiro
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={() => setOpen(true)} disabled={isPending}>
                  Alterar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => unlinkScript.mutate()}
                  disabled={isPending}
                >
                  {unlinkScript.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unlink className="h-4 w-4" />}
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Vincule este Short a um roteiro para comparar o planejado com o que foi publicado.
              </p>
              <Button variant="outline" className="w-full" onClick={() => setOpen(true)} disabled={isPending}>
                <Link2 className="h-4 w-4" />
                Vincular roteiro
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <LinkScriptDialog
        open={open}
        onOpenChange={setOpen}
        onSelectScript={handleLink}
        isPending={linkScript.isPending}
        currentScriptId={linkedScript?.script_id}
      />
    </>
  );
}
