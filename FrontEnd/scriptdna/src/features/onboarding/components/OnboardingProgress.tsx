import { cn } from "@/lib/utils";
import { ONBOARDING_TOTAL_STEPS, ONBOARDING_STEP_LABELS } from "@/stores/onboarding-store";

interface OnboardingProgressProps {
  currentStep: number;
  className?: string;
}

/**
 * OnboardingProgress — barra de progresso visual do wizard.
 * Mostra "Passo X de N" com barra colorida e labels opcionais.
 */
export function OnboardingProgress({
  currentStep,
  className,
}: OnboardingProgressProps) {
  const percent = Math.round((currentStep / (ONBOARDING_TOTAL_STEPS - 1)) * 100);
  const label = ONBOARDING_STEP_LABELS[currentStep] ?? "";

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-medium">{label}</span>
        <span>
          {currentStep + 1} de {ONBOARDING_TOTAL_STEPS}
        </span>
      </div>
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${percent}%` }}
          role="progressbar"
          aria-valuenow={currentStep + 1}
          aria-valuemin={1}
          aria-valuemax={ONBOARDING_TOTAL_STEPS}
          aria-label={`Passo ${currentStep + 1} de ${ONBOARDING_TOTAL_STEPS}: ${label}`}
        />
      </div>
      {/* Dots indicadores */}
      <div className="flex justify-between px-0.5">
        {Array.from({ length: ONBOARDING_TOTAL_STEPS }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 w-1.5 rounded-full transition-colors duration-300",
              i <= currentStep ? "bg-primary" : "bg-muted-foreground/30"
            )}
          />
        ))}
      </div>
    </div>
  );
}
