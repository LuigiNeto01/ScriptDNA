"use client";

import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { Dna, X, ArrowRight, CheckCircle2 } from "lucide-react";
import { type OnboardingGoal } from "@/stores/onboarding-store";

interface SetupBannerProps {
  currentStep: number;
  goal?: OnboardingGoal;
  niche?: string;
  onDismiss: () => void;
}

const GOAL_LABELS: Record<OnboardingGoal, string> = {
  views: "Mais visualizações",
  retention: "Mais retenção",
  subscribers: "Mais inscritos",
  comments: "Mais comentários",
  conversions: "Mais conversões",
  consistency: "Mais consistência",
};

/**
 * SetupBanner — banner exibido no dashboard quando o onboarding não foi concluído.
 * Opção B do briefing: não redireciona, apenas encoraja a continuar a configuração.
 */
export function SetupBanner({ currentStep, goal, niche, onDismiss }: SetupBannerProps) {
  const isNew = currentStep === 0 && !goal && !niche;

  return (
    <div
      className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 via-primary/3 to-transparent p-5"
      data-testid="setup-banner"
      role="complementary"
      aria-label="Configure sua conta"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* Ícone */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Dna className="h-5 w-5 text-primary" />
        </div>

        {/* Texto */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">
            {isNew ? "Complete sua configuração inicial" : "Continue de onde parou"}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
            {isNew
              ? "Leva menos de 2 minutos. Configure seu objetivo, nicho e conecte seu YouTube para experiência completa."
              : [
                  goal && `Objetivo: ${GOAL_LABELS[goal]}`,
                  niche && `Nicho: ${niche}`,
                ]
                  .filter(Boolean)
                  .join(" · ") || "Continue a configuração para desbloquear todos os recursos."}
          </p>
          {/* Indicadores de progresso rápido */}
          {!isNew && (
            <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                {goal ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <span className="h-3.5 w-3.5 rounded-full border border-muted-foreground/40 inline-block" />
                )}
                Objetivo
              </span>
              <span className="flex items-center gap-1">
                {niche ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <span className="h-3.5 w-3.5 rounded-full border border-muted-foreground/40 inline-block" />
                )}
                Nicho
              </span>
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="flex items-center gap-2 shrink-0">
          <LinkButton
            href="/onboarding"
            size="sm"
            className="gap-1.5"
            data-testid="setup-banner-cta"
          >
            {isNew ? "Começar" : "Continuar"}
            <ArrowRight className="h-3.5 w-3.5" />
          </LinkButton>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            aria-label="Dispensar banner de configuração"
            data-testid="setup-banner-dismiss"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
