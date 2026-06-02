import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBeatName, formatClock } from "@/lib/formatters";
import type { ScriptBeat } from "@/types/api";

const beatColors: Record<string, string> = {
  hook: "bg-red-500",
  setup: "bg-blue-500",
  conflict: "bg-orange-500",
  escalation: "bg-yellow-500",
  payoff: "bg-green-500",
  cta: "bg-purple-500",
};

export function VideoBeatsTimeline({
  beats,
  totalDuration,
}: {
  beats: ScriptBeat[];
  totalDuration: number | null;
}) {
  if (!beats.length) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-muted-foreground">
          Ainda nao encontramos partes narrativas nesta referencia.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Partes do video</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {totalDuration ? (
          <div className="relative h-10 overflow-hidden rounded-lg bg-muted">
            {beats.map((beat, index) => {
              const segment = beat as ScriptBeat & { start_time?: number; end_time?: number };
              const start = segment.start_time ?? (index * totalDuration) / beats.length;
              const end = segment.end_time ?? ((index + 1) * totalDuration) / beats.length;
              const left = (start / totalDuration) * 100;
              const width = ((end - start) / totalDuration) * 100;

              return (
                <div
                  key={beat.id}
                  className={`absolute top-0 h-full ${beatColors[beat.beat_type] ?? "bg-primary"} opacity-80`}
                  style={{ left: `${left}%`, width: `${Math.max(width, 1)}%` }}
                  title={`${formatBeatName(beat.beat_type)} (${formatClock(start)} - ${formatClock(end)})`}
                />
              );
            })}
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          {beats.map((beat) => (
            <div key={beat.id} className="rounded-lg border p-3 text-sm">
              <div className="mb-2 flex items-center justify-between gap-2">
                <Badge variant="outline">{formatBeatName(beat.beat_type)}</Badge>
                <span className="text-xs text-muted-foreground">
                  Intensidade emocional {Math.round((beat.intensity_score ?? 0) * 100)}%
                </span>
              </div>
              {beat.attention_goal && <p className="text-muted-foreground">{beat.attention_goal}</p>}
              {beat.curiosity_question && (
                <p className="mt-2 text-xs text-muted-foreground">Pergunta que prende: {beat.curiosity_question}</p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
