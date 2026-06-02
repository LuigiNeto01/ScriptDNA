import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SegmentTechnique } from "@/types/api";

export function VideoTechniquesPanel({
  techniques,
}: {
  techniques: SegmentTechnique[] | undefined;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Tecnicas de retencao</CardTitle>
      </CardHeader>
      <CardContent>
        {!techniques?.length ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma tecnica especifica foi destacada ainda.
          </p>
        ) : (
          <div className="space-y-3">
            {techniques.map((item) => (
              <div key={`${item.segment_id}-${item.technique_id}`} className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline">{item.technique?.name ?? "Tecnica"}</Badge>
                  <span className="text-xs text-muted-foreground">{Math.round(item.confidence * 100)}% confianca</span>
                </div>
                {item.evidence && <p className="mt-2 text-sm text-muted-foreground">{item.evidence}</p>}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
