import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ActionableLearning } from "@/types/api";

export function ShortLearningPanel({ learnings }: { learnings: ActionableLearning[] | null | undefined }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Aprendizados para proximos roteiros</CardTitle>
      </CardHeader>
      <CardContent>
        {!learnings?.length ? (
          <p className="text-sm text-muted-foreground">Quando a analise terminar, os aprendizados acionaveis aparecem aqui.</p>
        ) : (
          <div className="space-y-3">
            {learnings.map((learning, index) => (
              <div key={index} className="rounded-lg border p-3">
                <div className="mb-2 flex flex-wrap gap-2">
                  {learning.priority && <Badge variant="outline">{learning.priority}</Badge>}
                  {learning.category && <Badge variant="secondary">{learning.category}</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">
                  {learning.learning ?? learning.claim ?? learning.recommended_action}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
