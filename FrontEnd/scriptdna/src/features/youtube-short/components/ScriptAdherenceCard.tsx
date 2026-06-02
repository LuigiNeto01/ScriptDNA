import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatAnalysisScore } from "@/lib/formatters";
import type { ScriptAdherence } from "@/types/api";

export function ScriptAdherenceCard({
  adherence,
  scriptId,
}: {
  adherence: ScriptAdherence | null | undefined;
  scriptId: string | null;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">O video seguiu o roteiro?</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>
          Isso ajuda a IA a saber se deve avaliar o roteiro original ou o que foi realmente falado no video.
        </p>
        {adherence ? (
          <>
            <Badge variant="outline">{formatAnalysisScore(adherence.script_adherence_score)}</Badge>
            {adherence.major_differences.length > 0 && (
              <ul className="space-y-1">
                {adherence.major_differences.slice(0, 4).map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <p>Nenhuma comparacao com roteiro foi encontrada ainda.</p>
        )}
        {scriptId && <Link href={`/scripts/${scriptId}`} className="text-primary hover:underline">Abrir roteiro vinculado</Link>}
      </CardContent>
    </Card>
  );
}
