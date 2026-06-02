import { Badge } from "@/components/ui/badge";
import type { Video } from "@/types/api";

export function ReferenceVisibilityBadge({
  visibility,
}: {
  visibility: Video["visibility"];
}) {
  if (visibility === "public") {
    return <Badge variant="secondary">Publica</Badge>;
  }

  return <Badge variant="outline">Privada</Badge>;
}
