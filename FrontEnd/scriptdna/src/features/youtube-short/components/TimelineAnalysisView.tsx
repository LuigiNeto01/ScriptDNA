import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBeatName, formatClock } from "@/lib/formatters";
import type { TimelineAnalysis } from "@/types/api";

export function TimelineAnalysisView({ timeline }: { timeline: TimelineAnalysis | null | undefined }) {
  if (!timeline) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Linha do tempo da retencao</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Ainda nao temos uma linha do tempo para este Short.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Linha do tempo da retencao</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-2">
        <MomentList title="Momentos que prenderam atencao" items={timeline.strong_moments} />
        <MomentList title="Onde o publico saiu" items={timeline.drop_moments} />
      </CardContent>
    </Card>
  );
}

function MomentList({
  title,
  items,
}: {
  title: string;
  items: NonNullable<TimelineAnalysis["strong_moments"]>;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum trecho destacado.</p>
      ) : (
        items.slice(0, 5).map((moment, index) => (
          <div key={index} className="rounded-lg border p-3 text-sm">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant="outline">
                {formatClock(moment.start_time)} - {formatClock(moment.end_time)}
              </Badge>
              {moment.beat_type && <Badge variant="secondary">{formatBeatName(moment.beat_type)}</Badge>}
            </div>
            <p className="text-muted-foreground">{moment.reason ?? moment.possible_reason ?? "Trecho destacado pela analise."}</p>
            {moment.related_script_line && (
              <p className="mt-2 text-xs text-muted-foreground">Roteiro relacionado: {moment.related_script_line}</p>
            )}
          </div>
        ))
      )}
    </div>
  );
}
