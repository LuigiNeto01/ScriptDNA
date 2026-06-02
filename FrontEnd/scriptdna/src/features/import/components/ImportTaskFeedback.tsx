"use client";

import { TaskProgress } from "@/components/feedback/task-progress";
import { useTaskStatus } from "@/hooks/use-videos";

export function ImportTaskFeedback({ taskId }: { taskId: string }) {
  const task = useTaskStatus(taskId);

  return (
    <TaskProgress
      status={task.data?.status ?? "pending"}
      currentStep={task.data?.current_step}
      error={task.data?.error}
      message="Estamos preparando esta referencia para a IA. Quando terminar, ela podera ajudar a calibrar estilo, ritmo e estrutura dos proximos roteiros."
    />
  );
}
