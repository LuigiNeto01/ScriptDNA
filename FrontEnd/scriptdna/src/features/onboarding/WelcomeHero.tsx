import { Dna, PenTool, BarChart3, Lightbulb } from "lucide-react";
import { LinkButton } from "@/components/ui/link-button";
import { Button } from "@/components/ui/button";

interface WelcomeHeroProps {
  userName?: string | null;
  onGetStarted?: () => void;
}

/**
 * WelcomeHero — exibido na primeira vez que o usuário acessa o ScriptDNA.
 * Apresenta o produto com 3 benefícios concretos e ações de início.
 */
export function WelcomeHero({ userName, onGetStarted }: WelcomeHeroProps) {
  const greeting = userName ? `Olá, ${userName.split(" ")[0]}!` : "Bem-vindo!";

  const benefits = [
    {
      icon: PenTool,
      title: "Gere roteiros com IA",
      description:
        "Crie roteiros de Shorts otimizados para retenção em segundos, baseados nos padrões do seu canal.",
    },
    {
      icon: BarChart3,
      title: "Analise o que funciona",
      description:
        "Entenda exatamente onde seu público para de assistir e o que faz os melhores vídeos performarem.",
    },
    {
      icon: Lightbulb,
      title: "Aprenda e melhore",
      description:
        "A IA aprende com cada Short analisado e usa esses aprendizados nos próximos roteiros automaticamente.",
    },
  ];

  return (
    <div className="flex flex-col items-center gap-10 py-8 text-center">
      {/* Logo + saudação */}
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <Dna className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{greeting}</h1>
          <p className="mt-2 text-muted-foreground max-w-md">
            O <strong>ScriptDNA</strong> conecta seus dados do YouTube com inteligência artificial para criar roteiros melhores a cada publicação.
          </p>
        </div>
      </div>

      {/* Benefícios */}
      <div className="grid gap-5 sm:grid-cols-3 max-w-2xl w-full text-left">
        {benefits.map((b) => (
          <div
            key={b.title}
            className="flex flex-col gap-3 rounded-xl border bg-card p-5"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <b.icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">{b.title}</p>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                {b.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Ações */}
      <div className="flex flex-col items-center gap-3 sm:flex-row">
        {onGetStarted ? (
          <Button size="lg" onClick={onGetStarted}>
            Começar configuração
          </Button>
        ) : (
          <LinkButton href="/onboarding" size="lg">
            Começar configuração
          </LinkButton>
        )}
        <LinkButton href="/" variant="ghost" size="lg">
          Ir para o início
        </LinkButton>
      </div>
    </div>
  );
}
