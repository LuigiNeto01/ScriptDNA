import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

interface OnboardingStepCardProps {
  /** Número do passo (1, 2, 3...) */
  step: number;
  /** Título do passo */
  title: string;
  /** Descrição */
  description?: string;
  /** Se o passo está completo */
  completed?: boolean;
  /** Se o passo está ativo (atual) */
  active?: boolean;
  /** Conteúdo interno do passo */
  children?: React.ReactNode;
  className?: string;
}

/**
 * OnboardingStepCard — card numerado para wizard de onboarding.
 * Exibe progresso visual com estado completo/ativo/pendente.
 */
export function OnboardingStepCard({
  step,
  title,
  description,
  completed = false,
  active = false,
  children,
  className,
}: OnboardingStepCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border p-5 transition-all",
        active && "border-primary/50 bg-primary/5 shadow-sm",
        completed && "opacity-70",
        !active && !completed && "bg-card",
        className
      )}
    >
      <div className="flex items-start gap-4">
        {/* Indicador de passo */}
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-all",
            completed
              ? "bg-emerald-500 text-white"
              : active
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
          )}
        >
          {completed ? <CheckCircle2 className="h-4 w-4" /> : step}
        </div>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          <h3
            className={cn(
              "font-semibold text-sm",
              completed && "line-through text-muted-foreground"
            )}
          >
            {title}
          </h3>
          {description && (
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              {description}
            </p>
          )}
          {active && children && (
            <div className="mt-4">{children}</div>
          )}
        </div>
      </div>
    </div>
  );
}
