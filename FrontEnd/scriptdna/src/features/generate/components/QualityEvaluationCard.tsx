import { AlertTriangle, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TermTooltip } from "@/components/help/term-tooltip";
import type { QualityEvaluation } from "@/types/api";

const RISK_LABELS: Record<string, string> = {
  copy_reference: "Risco de parecer cópia",
  long_sentences: "Frases longas demais",
  early_payoff: "Entrega da promessa cedo demais",
};

const SCORE_LABELS: Array<{ key: keyof QualityEvaluation["scores"]; label: string }> = [
  { key: "hook", label: "Abertura" },
  { key: "retention", label: "Retenção" },
  { key: "clarity", label: "Clareza" },
  { key: "cta", label: "Chamada p/ ação" },
  { key: "style", label: "Estilo" },
];

function ScoreCell({ label, value }: { label: string; value?: number | null }) {
  const pct = value != null ? Math.round(value * 100) : null;
  const color =
    pct == null
      ? ""
      : pct >= 70
        ? "text-green-600"
        : pct >= 40
          ? "text-yellow-600"
          : "text-red-600";
  return (
    <div className="rounded-md border p-2 text-center">
      <p className="text-[11px] text-muted-foreground mb-0.5">{label}</p>
      <p className={`text-sm font-semibold ${color}`}>{pct != null ? `${pct}%` : "—"}</p>
    </div>
  );
}

interface QualityEvaluationCardProps {
  quality: QualityEvaluation;
}

export function QualityEvaluationCard({ quality }: QualityEvaluationCardProps) {
  const overallPct = Math.round(quality.quality_score * 100);
  const overallColor =
    overallPct >= 70
      ? "text-green-600"
      : overallPct >= 40
        ? "text-yellow-600"
        : "text-red-600";

  const risks = quality.risks
    ? Object.entries(quality.risks).filter(([, v]) => v != null && v > 0.5)
    : [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <TermTooltip term="Avaliação de qualidade" variant="underline">
              Score gerado pela IA com base na força da abertura, capacidade de retenção
              e clareza do roteiro.
            </TermTooltip>
          </CardTitle>
          <Badge variant="secondary" className={`font-mono ${overallColor}`}>
            {overallPct}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {SCORE_LABELS.map(({ key, label }) => (
            <ScoreCell key={key} label={label} value={quality.scores[key]} />
          ))}
        </div>

        {risks.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />
              Riscos detectados
            </p>
            <ul className="space-y-1">
              {risks.map(([key]) => (
                <li key={key} className="text-xs text-muted-foreground">
                  • {RISK_LABELS[key] ?? key}
                </li>
              ))}
            </ul>
          </div>
        )}

        {(quality.fix_suggestions?.length ?? 0) > 0 && (
          <ul className="space-y-1">
            {quality.fix_suggestions?.map((s, i) => (
              <li key={i} className="text-xs text-muted-foreground">
                • {s}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
