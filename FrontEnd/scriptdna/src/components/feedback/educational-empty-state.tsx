import { cn } from "@/lib/utils";
import { Lightbulb } from "lucide-react";

type EmptyStateVariant =
  | "no-youtube"
  | "no-scripts"
  | "no-references"
  | "no-insights"
  | "no-ideas"
  | "first-access"
  | "processing"
  | "default";

interface EducationalEmptyStateProps {
  /** Variante pré-configurada — define ícone, título e dicas padrão */
  variant?: EmptyStateVariant;
  /** Ícone personalizado (sobrescreve o da variant) */
  icon?: React.ElementType;
  /** Título principal */
  title?: string;
  /** Descrição curta */
  description?: string;
  /** Ação primária */
  action?: React.ReactNode;
  /** Ação secundária (menos destaque) */
  secondaryAction?: React.ReactNode;
  /** Lista de dicas educativas */
  tips?: string[];
  className?: string;
}

const VARIANT_DEFAULTS: Record<
  EmptyStateVariant,
  {
    icon: React.ElementType;
    title: string;
    description: string;
    tips?: string[];
  }
> = {
  "no-youtube": {
    icon: () => (
      <svg viewBox="0 0 24 24" className="h-8 w-8 fill-current">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
    title: "Canal YouTube não conectado",
    description:
      "Conecte seu canal para importar Shorts, analisar métricas e gerar insights personalizados.",
    tips: [
      "A conexão é segura via OAuth do Google",
      "Você pode desconectar a qualquer momento",
      "Os dados ficam apenas na sua conta",
    ],
  },
  "no-scripts": {
    icon: () => (
      <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
      </svg>
    ),
    title: "Nenhum roteiro ainda",
    description:
      "Crie seu primeiro roteiro com a IA e comece o ciclo de gerar, publicar e melhorar.",
    tips: [
      "Leva menos de 2 minutos para gerar um roteiro",
      "A IA aprende com seus Shorts anteriores",
      "Você pode criar várias versões e comparar",
    ],
  },
  "no-references": {
    icon: () => (
      <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />
      </svg>
    ),
    title: "Nenhuma referência ainda",
    description:
      "Importe roteiros ou vídeos de referência para a IA aprender os padrões que funcionam no seu nicho.",
    tips: [
      "Você pode importar texto, arquivo ou link",
      "Quanto mais referências, melhor o aprendizado",
      "As referências ficam só na sua conta",
    ],
  },
  "no-insights": {
    icon: Lightbulb,
    title: "Nenhum aprendizado ainda",
    description:
      "Analise seus Shorts para que a IA identifique o que funciona melhor no seu canal.",
    tips: [
      "Os aprendizados são gerados automaticamente após analisar vídeos",
      "Quanto mais Shorts analisados, mais preciso o resultado",
      "Os aprendizados guiam a geração de novos roteiros",
    ],
  },
  "no-ideas": {
    icon: () => (
      <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
      </svg>
    ),
    title: "Nenhuma ideia de vídeo ainda",
    description:
      "Gere sugestões personalizadas de vídeos com base nos padrões do seu canal.",
    tips: [
      "As sugestões são baseadas nos seus insights e tendências",
      "Você pode converter uma sugestão diretamente em roteiro",
      "Novas sugestões são geradas com cada análise do canal",
    ],
  },
  "first-access": {
    icon: () => (
      <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
      </svg>
    ),
    title: "Bem-vindo ao ScriptDNA!",
    description:
      "Comece conectando seu canal do YouTube ou importando suas primeiras referências.",
    tips: [
      "Configure em 3 passos simples",
      "Sem necessidade de habilidades técnicas",
      "Seus dados são privados e seguros",
    ],
  },
  processing: {
    icon: () => (
      <svg viewBox="0 0 24 24" className="h-8 w-8 animate-spin" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
      </svg>
    ),
    title: "Processando...",
    description: "Aguarde enquanto a IA analisa seus dados.",
  },
  default: {
    icon: () => (
      <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 0 0-2.15-1.588H6.911a2.25 2.25 0 0 0-2.15 1.588L2.35 13.177a2.25 2.25 0 0 0-.1.661Z" />
      </svg>
    ),
    title: "Nada por aqui ainda",
    description: "Esta seção ainda não tem conteúdo.",
  },
};

/**
 * EducationalEmptyState — versão rica do EmptyState com dicas educativas.
 * Substitui o EmptyState mínimo com contexto e orientação para o usuário.
 */
export function EducationalEmptyState({
  variant = "default",
  icon: CustomIcon,
  title,
  description,
  action,
  secondaryAction,
  tips,
  className,
}: EducationalEmptyStateProps) {
  const defaults = VARIANT_DEFAULTS[variant];
  const IconComponent = CustomIcon ?? defaults.icon;
  const displayTitle = title ?? defaults.title;
  const displayDescription = description ?? defaults.description;
  const displayTips = tips ?? defaults.tips;

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-5 py-12 px-6 text-center",
        className
      )}
    >
      {/* Ícone */}
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <IconComponent />
      </div>

      {/* Texto principal */}
      <div className="max-w-sm space-y-1.5">
        <h3 className="text-base font-semibold">{displayTitle}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {displayDescription}
        </p>
      </div>

      {/* Ações */}
      {(action || secondaryAction) && (
        <div className="flex flex-col items-center gap-2 sm:flex-row">
          {action}
          {secondaryAction && (
            <div className="text-sm text-muted-foreground">{secondaryAction}</div>
          )}
        </div>
      )}

      {/* Dicas educativas */}
      {displayTips && displayTips.length > 0 && (
        <div className="mt-2 w-full max-w-xs rounded-xl border bg-muted/40 p-4 text-left">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Sabia que...
          </p>
          <ul className="space-y-1.5">
            {displayTips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-primary" />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
