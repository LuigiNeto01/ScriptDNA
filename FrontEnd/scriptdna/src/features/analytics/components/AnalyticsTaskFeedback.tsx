interface AnalyticsTaskFeedbackProps {
  status: string;
  message?: string | null;
}

export function AnalyticsTaskFeedback({ status, message }: AnalyticsTaskFeedbackProps) {
  const isSuccess = status === "success" || status === "done";
  const isError = status === "error" || status === "failure";

  return (
    <div
      className={`mt-4 rounded-lg border p-3 text-sm ${
        isSuccess
          ? "border-green-200 bg-green-50 text-green-800"
          : isError
          ? "border-destructive/30 bg-destructive/10 text-destructive"
          : "bg-muted/30"
      }`}
      data-testid="analytics-task-feedback"
    >
      <p className="font-medium">
        {isSuccess ? "Concluído" : isError ? "Erro" : "Em andamento..."}
      </p>
      {message && <p className="mt-1 text-muted-foreground">{message}</p>}
    </div>
  );
}
