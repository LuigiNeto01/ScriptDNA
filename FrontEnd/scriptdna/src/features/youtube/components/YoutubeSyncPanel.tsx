"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TaskProgress } from "@/components/feedback/task-progress";
import { RefreshCw, Loader2 } from "lucide-react";
import type { TaskStatus } from "@/types/api";

export function YoutubeSyncPanel({
  onSync,
  isPending,
  task,
}: {
  onSync: () => void;
  isPending: boolean;
  task?: TaskStatus;
}) {
  return (
    <Card>
      <CardContent className="space-y-4 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">Sincronizar Shorts</p>
            <p className="text-sm text-muted-foreground">
              Traga seus Shorts para comecar a analise visual de desempenho.
            </p>
          </div>
          <Button onClick={onSync} disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Sincronizar Shorts
          </Button>
        </div>

        {task && (
          <TaskProgress
            status={task.status}
            currentStep={task.current_step}
            error={task.error}
            message="Estamos buscando seus Shorts. Quando terminar, a lista sera atualizada automaticamente."
          />
        )}
      </CardContent>
    </Card>
  );
}
