"use client";

import { Badge } from "@/components/ui/badge";
import { formatScriptStatus } from "@/lib/formatters";
import type { ScriptStatus } from "@/types/api";

const VARIANT_MAP: Record<ScriptStatus, "default" | "secondary" | "outline" | "destructive"> = {
  draft: "secondary",
  approved: "default",
  published: "default",
  analyzed: "outline",
  archived: "destructive",
};

interface ScriptStatusBadgeProps {
  status: ScriptStatus;
  className?: string;
}

export function ScriptStatusBadge({ status, className }: ScriptStatusBadgeProps) {
  return (
    <Badge variant={VARIANT_MAP[status]} className={className} data-testid="script-status-badge">
      {formatScriptStatus(status)}
    </Badge>
  );
}
