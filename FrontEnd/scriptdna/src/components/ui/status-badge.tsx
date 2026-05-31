import { Badge } from "@/components/ui/badge";
import type { VideoStatus } from "@/types/api";

const statusConfig: Record<
  VideoStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  pending: { label: "Pendente", variant: "outline" },
  transcribing: { label: "Transcrevendo", variant: "secondary" },
  analyzing: { label: "Analisando", variant: "secondary" },
  embedding: { label: "Embeddings", variant: "secondary" },
  done: { label: "Concluído", variant: "default" },
  error: { label: "Erro", variant: "destructive" },
};

export function StatusBadge({ status }: { status: VideoStatus }) {
  const config = statusConfig[status];
  return (
    <Badge variant={config.variant} data-testid="status-badge">
      {config.label}
    </Badge>
  );
}
