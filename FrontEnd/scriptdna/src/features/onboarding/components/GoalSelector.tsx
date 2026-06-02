import { cn } from "@/lib/utils";
import {
  useOnboardingStore,
  GOAL_OPTIONS,
} from "@/stores/onboarding-store";
import { CheckCircle2 } from "lucide-react";

interface GoalSelectorProps {
  className?: string;
}

/**
 * GoalSelector — grid de cards para selecionar o objetivo principal do canal.
 * Persiste escolha no onboarding store.
 */
export function GoalSelector({ className }: GoalSelectorProps) {
  const { goal, setGoal } = useOnboardingStore();

  return (
    <div className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2", className)}>
      {GOAL_OPTIONS.map((option) => {
        const selected = goal === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setGoal(option.value)}
            data-testid={`goal-${option.value}`}
            aria-pressed={selected}
            className={cn(
              "relative flex flex-col gap-1 rounded-xl border p-4 text-left transition-all duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selected
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border bg-card hover:border-primary/40 hover:bg-muted/40"
            )}
          >
            {selected && (
              <CheckCircle2 className="absolute right-3 top-3 h-4 w-4 text-primary" />
            )}
            <span className="text-sm font-semibold leading-snug">
              {option.label}
            </span>
            <span className="text-xs text-muted-foreground leading-relaxed">
              {option.description}
            </span>
          </button>
        );
      })}
    </div>
  );
}
