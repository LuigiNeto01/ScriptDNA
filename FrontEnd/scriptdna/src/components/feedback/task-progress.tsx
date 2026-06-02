"use client";

import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";
import { formatTaskStatus, formatTaskStatusVariant, type TaskStatusValue } from "@/lib/formatters";
import { cn } from "@/lib/utils";

interface TaskProgressProps {
  status: TaskStatusValue | null | undefined;
  message?: string | null;
  error?: string | null;
  currentStep?: string | null;
  /** Se true, exibe de forma compacta (inline) */
  compact?: boolean;
  className?: string;
}

/**
 * TaskProgress — exibe o status de uma task assíncrona (Celery)
 * com linguagem amigável ao invés de strings técnicas como "pending", "success", "failure".
 *
 * Substitui os padrões inline espalhados por várias páginas que exibiam
 * status brutos como "pending" ou "success" diretamente ao usuário.
 */
export function TaskProgress({
  status,
  message,
  error,
  currentStep,
  compact = false,
  className,
}: TaskProgressProps) {
  if (!status) return null;

  const isDone = status === "success" || status === "done";
  const isFailed = status === "error" || status === "failure";
  const isRunning =
    !isDone && !isFailed && status !== "pending";

  const friendlyStatus = formatTaskStatus(status);
  const variant = formatTaskStatusVariant(status);

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {isRunning && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
        {isDone && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
        {isFailed && <XCircle className="h-3.5 w-3.5 text-destructive" />}
        {status === "pending" && <Clock className="h-3.5 w-3.5 text-muted-foreground" />}
        <span className="text-sm text-muted-foreground">{friendlyStatus}</span>
        {error && <span className="text-xs text-destructive">— {error}</span>}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg border p-3 text-sm",
        isFailed && "border-destructive/40 bg-destructive/5",
        isDone && "border-emerald-500/30 bg-emerald-500/5",
        !isFailed && !isDone && "bg-muted/30",
        className
      )}
    >
      <div className="flex items-center gap-2">
        {isRunning && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
        )}
        {isDone && (
          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
        )}
        {isFailed && (
          <XCircle className="h-4 w-4 text-destructive shrink-0" />
        )}
        {status === "pending" && (
          <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
        <span className="font-medium">{friendlyStatus}</span>
        <Badge variant={variant} className="ml-auto text-[10px]">
          {friendlyStatus}
        </Badge>
      </div>

      {currentStep && !isFailed && !isDone && (
        <p className="mt-1.5 text-xs text-muted-foreground">
          {formatTaskStatus(currentStep)}
        </p>
      )}

      {message && !isFailed && (
        <p className="mt-1.5 text-xs text-muted-foreground">{message}</p>
      )}

      {error && (
        <div className="mt-2 flex items-start gap-1.5 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
