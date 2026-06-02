import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { formatBeatName, formatClock } from "@/lib/formatters";
import type { ScriptBeat, TranscriptSegment } from "@/types/api";

export function VideoTranscriptPanel({
  segments,
  beats,
}: {
  segments: TranscriptSegment[];
  beats: ScriptBeat[];
}) {
  const beatBySegment = new Map(beats.map((beat) => [beat.segment_id, beat]));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Transcricao por trecho</CardTitle>
      </CardHeader>
      <CardContent>
        {segments.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ainda nao temos transcricao segmentada para esta referencia.</p>
        ) : (
          <ScrollArea className="h-[520px]">
            <div className="space-y-3 pr-4">
              {segments.map((segment) => {
                const beat = beatBySegment.get(segment.id);
                return (
                  <div key={segment.id} className="space-y-2 rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatClock(segment.start_time)} - {formatClock(segment.end_time)}
                      </span>
                      {beat && <Badge variant="outline">{formatBeatName(beat.beat_type)}</Badge>}
                    </div>
                    <p className="text-sm leading-relaxed">{segment.text}</p>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
