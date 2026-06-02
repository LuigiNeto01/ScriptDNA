"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Video } from "lucide-react";

export function YoutubeConnectionPanel({
  onConnect,
  isPending,
}: {
  onConnect: () => void;
  isPending: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="font-medium">Seu canal ainda nao esta conectado</p>
          <p className="text-sm text-muted-foreground">
            Conecte para a IA analisar seus Shorts reais e aprender com o que funciona no seu canal.
          </p>
        </div>
        <Button onClick={onConnect} disabled={isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
          Conectar YouTube
        </Button>
      </CardContent>
    </Card>
  );
}
