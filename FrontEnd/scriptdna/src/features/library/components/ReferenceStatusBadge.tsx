import { StatusBadge } from "@/components/ui/status-badge";
import type { VideoStatus } from "@/types/api";

export function ReferenceStatusBadge({ status }: { status: VideoStatus }) {
  return <StatusBadge status={status} />;
}
