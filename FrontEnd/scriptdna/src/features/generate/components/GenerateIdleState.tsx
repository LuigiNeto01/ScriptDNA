import { Lightbulb, PenTool, Target, Zap } from "lucide-react";

const TIPS = [
  {
    icon: Lightbulb,
    title: "Seja específico no tema",
    desc: '"5 erros ao estudar para concurso" converte melhor que "dicas de estudo"',
  },
  {
    icon: Target,
    title: "Descreva a ideia nas opções avançadas",
    desc: "Escreva o conceito com suas palavras — a IA desenvolve a estrutura narrativa completa",
  },
  {
    icon: Zap,
    title: "Experimente tipos de abertura",
    desc: '"Lacuna de Curiosidade" e "Afirmação Ousada" costumam gerar os melhores resultados',
  },
];

export function GenerateIdleState() {
  return (
    <div className="space-y-4" data-testid="generate-idle-state">
      <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed py-10 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <PenTool className="h-7 w-7 text-primary" />
        </div>
        <div className="max-w-xs space-y-1">
          <h3 className="text-base font-semibold">Seu roteiro aparece aqui</h3>
          <p className="text-sm text-muted-foreground">
            Preencha o tema e clique em{" "}
            <span className="font-medium text-foreground">Gerar Roteiro</span> para
            começar.
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-muted/40 p-4 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Dicas para melhores resultados
        </p>
        <div className="space-y-3">
          {TIPS.map((tip, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <tip.icon className="h-3.5 w-3.5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium">{tip.title}</p>
                <p className="text-xs text-muted-foreground">{tip.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
