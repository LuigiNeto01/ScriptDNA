import { LinkButton } from "@/components/ui/link-button";
import { Button } from "@/components/ui/button";
import { BookOpen, Upload, Layers, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReferenceStepProps {
  hasReferences?: boolean;
  onSkip?: () => void;
  className?: string;
}

/**
 * ReferenceStep — etapa de referências no wizard de onboarding.
 * Explica o conceito sem jargões técnicos (sem "RAG", "embeddings" etc).
 */
export function ReferenceStep({
  hasReferences = false,
  onSkip,
  className,
}: ReferenceStepProps) {
  const examples = [
    {
      icon: Layers,
      title: "Vídeos que funcionam bem",
      description: "Shorts de criadores que têm o estilo que você quer ter.",
    },
    {
      icon: BookOpen,
      title: "Seus próprios roteiros",
      description: "Textos de vídeos anteriores que performaram acima da média.",
    },
    {
      icon: Info,
      title: "Exemplos do nicho",
      description: "Conteúdo de referência do seu mercado — mesmo de outros formatos.",
    },
  ];

  return (
    <div className={cn("space-y-6", className)}>
      {/* Explicação */}
      <p className="text-sm text-muted-foreground leading-relaxed">
        Referências ajudam a IA a entender o estilo, ritmo e tipo de gancho que você quer usar.
        Quanto mais exemplos você adicionar, mais alinhada será a geração de roteiros com o seu tom.
      </p>

      {/* O que importar */}
      <div className="grid gap-3">
        {examples.map((ex) => (
          <div key={ex.title} className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
              <ex.icon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">{ex.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{ex.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Ações */}
      {hasReferences ? (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 text-center">
          <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
            Você já tem referências adicionadas!
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            A IA já tem material para trabalhar. Você pode adicionar mais a qualquer momento.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row">
          <LinkButton
            href="/import"
            className="flex-1 gap-2"
            data-testid="import-references-btn"
          >
            <Upload className="h-4 w-4" />
            Importar referência
          </LinkButton>
          <LinkButton
            href="/library"
            variant="outline"
            className="flex-1 gap-2"
          >
            <BookOpen className="h-4 w-4" />
            Ver biblioteca
          </LinkButton>
        </div>
      )}

      <div className="text-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={onSkip}
          className="text-muted-foreground text-xs"
          data-testid="skip-references-btn"
        >
          Pular por enquanto
        </Button>
      </div>
    </div>
  );
}
