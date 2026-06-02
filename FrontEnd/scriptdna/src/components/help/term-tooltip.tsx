import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TermTooltipProps {
  /** Termo a ser exibido */
  term: string;
  /** Definição amigável do termo */
  children: React.ReactNode;
  /** Posição do tooltip */
  side?: "top" | "bottom" | "left" | "right";
  /** Variante de exibição do termo */
  variant?: "underline" | "badge" | "icon-only";
  className?: string;
}

/**
 * TermTooltip — exibe um termo técnico com tooltip explicativo.
 * Usado para traduzir jargões de análise de vídeo/IA para linguagem
 * compreensível pelo criador de conteúdo.
 *
 * Exemplos de uso:
 * <TermTooltip term="Retenção Média">
 *   Porcentagem média do vídeo assistida pelo seu público.
 * </TermTooltip>
 *
 * <TermTooltip term="Força do Gancho" variant="badge">
 *   Quão bem a abertura do vídeo prende a atenção nos primeiros 3 segundos.
 * </TermTooltip>
 */
export function TermTooltip({
  term,
  children,
  side = "top",
  variant = "underline",
  className,
}: TermTooltipProps) {
  const triggerElement = (() => {
    switch (variant) {
      case "badge":
        return (
          <span
            className={cn(
              "inline-flex cursor-help items-center gap-1 rounded-full border bg-muted px-2 py-0.5 text-xs font-medium hover:bg-muted/80 transition-colors",
              className
            )}
          >
            {term}
            <HelpCircle className="h-3 w-3 text-muted-foreground" />
          </span>
        );
      case "icon-only":
        return (
          <button
            type="button"
            className={cn(
              "inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors",
              className
            )}
            aria-label={`O que é ${term}?`}
          >
            <HelpCircle className="h-3.5 w-3.5" />
          </button>
        );
      default:
        return (
          <span
            className={cn(
              "cursor-help border-b border-dashed border-muted-foreground/50 text-inherit hover:border-foreground/50 transition-colors",
              className
            )}
          >
            {term}
          </span>
        );
    }
  })();

  return (
    <TooltipProvider delay={300}>
      <Tooltip>
        <TooltipTrigger render={triggerElement} />
        <TooltipContent side={side} className="max-w-[240px] text-sm leading-relaxed">
          {children}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
