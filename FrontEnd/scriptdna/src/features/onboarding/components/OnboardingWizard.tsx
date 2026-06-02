"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  useOnboardingStore,
  ONBOARDING_TOTAL_STEPS,
} from "@/stores/onboarding-store";
import { useYouTubeChannel } from "@/hooks/use-youtube";
import { useVideos } from "@/hooks/use-videos";
import { useAuthStore } from "@/stores/auth-store";
import { OnboardingProgress } from "./OnboardingProgress";
import { GoalSelector } from "./GoalSelector";
import { NicheSelector } from "./NicheSelector";
import { YoutubeConnectStep } from "./YoutubeConnectStep";
import { ReferenceStep } from "./ReferenceStep";
import { DemoModal } from "./DemoModal";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import {
  Dna,
  PenTool,
  BarChart3,
  Lightbulb,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Rocket,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Layout base do wizard ─────────────────────────────────────────────────

function WizardCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-xl rounded-2xl border bg-card shadow-xl">
      {children}
    </div>
  );
}

// ─── Etapa 1: Boas-vindas ─────────────────────────────────────────────────

function StepWelcome({ onNext, onDemo }: { onNext: () => void; onDemo: () => void }) {
  const { user } = useAuthStore();
  const firstName = user?.name?.split(" ")[0] ?? null;

  const benefits = [
    {
      icon: PenTool,
      title: "Crie roteiros com base no que já funciona",
      description:
        "A IA aprende com seus Shorts e gera roteiros alinhados ao seu estilo e ao que seu público ama.",
    },
    {
      icon: BarChart3,
      title: "Entenda onde seus vídeos perdem retenção",
      description:
        "Veja exatamente em qual segundo o público para de assistir e o que fazer para melhorar.",
    },
    {
      icon: Lightbulb,
      title: "Receba próximos passos e ideias melhores",
      description:
        "Com o tempo, o sistema aprende o que funciona no seu canal e sugere ideias cada vez melhores.",
    },
  ];

  return (
    <div className="flex flex-col items-center gap-8 p-8 text-center">
      {/* Logo */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <Dna className="h-7 w-7 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {firstName ? `Olá, ${firstName}! 👋` : "Bem-vindo ao ScriptDNA! 👋"}
          </h1>
          <p className="mt-2 text-muted-foreground text-sm max-w-sm mx-auto leading-relaxed">
            O ScriptDNA aprende com seus Shorts, entende o que prende atenção no seu canal e te
            ajuda a criar roteiros melhores com base em dados reais.
          </p>
        </div>
      </div>

      {/* Benefícios */}
      <div className="grid gap-4 text-left w-full">
        {benefits.map((b) => (
          <div key={b.title} className="flex items-start gap-4 rounded-xl border bg-muted/30 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <b.icon className="h-4.5 w-4.5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-snug">{b.title}</p>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{b.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Ações */}
      <div className="flex w-full flex-col gap-3">
        <Button
          size="lg"
          onClick={onNext}
          className="w-full gap-2"
          data-testid="start-onboarding-btn"
        >
          <Rocket className="h-4 w-4" />
          Começar configuração
        </Button>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onDemo}
            className="flex-1 text-xs gap-1.5 text-muted-foreground"
            data-testid="see-demo-btn"
          >
            <Eye className="h-3.5 w-3.5" />
            Ver exemplo de como funciona
          </Button>
          <LinkButton
            href="/"
            variant="ghost"
            className="flex-1 text-xs text-muted-foreground"
          >
            Pular configuração
          </LinkButton>
        </div>
      </div>
    </div>
  );
}

// ─── Etapa 2: Objetivo ────────────────────────────────────────────────────

function StepGoal() {
  return (
    <div className="flex flex-col gap-5 p-8">
      <div>
        <h2 className="text-xl font-bold">Qual é seu principal objetivo agora?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Isso ajuda a IA a focar nas métricas e estratégias mais relevantes para você.
        </p>
      </div>
      <GoalSelector />
    </div>
  );
}

// ─── Etapa 3: Nicho ───────────────────────────────────────────────────────

function StepNiche() {
  return (
    <div className="flex flex-col gap-5 p-8">
      <div>
        <h2 className="text-xl font-bold">Sobre o que você cria conteúdo?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          O nicho ajuda a calibrar o estilo de linguagem e as referências usadas nos roteiros.
        </p>
      </div>
      <NicheSelector />
    </div>
  );
}

// ─── Etapa 4: YouTube ─────────────────────────────────────────────────────

function StepYoutube({ onSkip }: { onSkip: () => void }) {
  const channel = useYouTubeChannel();
  const connected = channel.data?.connected === true;

  return (
    <div className="flex flex-col gap-5 p-8">
      <div>
        <h2 className="text-xl font-bold">Conecte seu canal do YouTube</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Opcional, mas recomendado para uma experiência completa.
        </p>
      </div>
      <YoutubeConnectStep
        alreadyConnected={connected}
        onSkip={onSkip}
      />
    </div>
  );
}

// ─── Etapa 5: Referências ─────────────────────────────────────────────────

function StepReferences({ onSkip }: { onSkip: () => void }) {
  const references = useVideos({ status: "done" });
  const refsData = references.data as { data?: unknown[] } | unknown[] | undefined;
  const hasReferences = Array.isArray(refsData)
    ? refsData.length > 0
    : ((refsData as { data?: unknown[] })?.data?.length ?? 0) > 0;

  return (
    <div className="flex flex-col gap-5 p-8">
      <div>
        <h2 className="text-xl font-bold">Adicione referências</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Roteiros e vídeos de referência que a IA usará para calibrar seu estilo.
        </p>
      </div>
      <ReferenceStep hasReferences={hasReferences} onSkip={onSkip} />
    </div>
  );
}

// ─── Etapa 6: CTA final ───────────────────────────────────────────────────

function StepFinal({ onComplete }: { onComplete: () => void }) {
  return (
    <div className="flex flex-col items-center gap-8 p-8 text-center">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Tudo pronto! 🎉</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
            Agora vamos criar seu primeiro roteiro. A IA já tem o contexto necessário para
            gerar algo alinhado ao seu canal.
          </p>
        </div>
      </div>

      <div className="flex w-full flex-col gap-3">
        <LinkButton
          href="/generate"
          size="lg"
          className="w-full gap-2"
          data-testid="go-generate-btn"
          onClick={onComplete}
        >
          <PenTool className="h-4 w-4" />
          Criar primeiro roteiro
        </LinkButton>
        <Button
          variant="outline"
          onClick={onComplete}
          className="w-full"
          data-testid="go-dashboard-btn"
        >
          Ir para o início
        </Button>
      </div>
    </div>
  );
}

// ─── OnboardingWizard principal ───────────────────────────────────────────

export function OnboardingWizard() {
  const router = useRouter();
  const store = useOnboardingStore();
  const { currentStep, goal, niche, nextStep, prevStep, skipYoutube, skipReferences, complete } =
    store;

  const [demoOpen, setDemoOpen] = useState(false);

  function handleComplete() {
    complete();
    router.push("/");
  }

  // Regras de validação por etapa (permite avançar sem obrigatoriedade)
  const canAdvance = (() => {
    if (currentStep === 1) return !!goal; // objetivo é obrigatório
    if (currentStep === 2) return (niche?.trim().length ?? 0) > 0; // nicho é obrigatório
    return true;
  })();

  const isLastStep = currentStep === ONBOARDING_TOTAL_STEPS - 1;

  return (
    <>
      <DemoModal open={demoOpen} onClose={() => setDemoOpen(false)} />

      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
        {/* Wizard Card */}
        <WizardCard>
          {/* Progress (exceto etapa 0) */}
          {currentStep > 0 && (
            <div className="border-b px-8 pt-6 pb-4">
              <OnboardingProgress currentStep={currentStep} />
            </div>
          )}

          {/* Conteúdo da etapa */}
          <div
            key={currentStep}
            className={cn(
              "transition-all duration-300",
              "animate-in fade-in-0 slide-in-from-right-2"
            )}
          >
            {currentStep === 0 && (
              <StepWelcome
                onNext={nextStep}
                onDemo={() => setDemoOpen(true)}
              />
            )}
            {currentStep === 1 && <StepGoal />}
            {currentStep === 2 && <StepNiche />}
            {currentStep === 3 && <StepYoutube onSkip={skipYoutube} />}
            {currentStep === 4 && <StepReferences onSkip={skipReferences} />}
            {currentStep === 5 && <StepFinal onComplete={handleComplete} />}
          </div>

          {/* Navegação (exceto etapa 0 e final) */}
          {currentStep > 0 && !isLastStep && (
            <div className="border-t px-8 py-4 flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={prevStep}
                className="gap-1.5 text-muted-foreground"
                data-testid="onboarding-prev-btn"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>

              {/* Etapas 1 e 2 têm botão "Próximo" habilitado somente com seleção */}
              {(currentStep === 1 || currentStep === 2) && (
                <Button
                  onClick={nextStep}
                  disabled={!canAdvance}
                  className="gap-1.5"
                  data-testid="onboarding-next-btn"
                >
                  Próximo
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}

              {/* Etapas 3 e 4 (YouTube / Referências) têm navegação própria nos sub-componentes */}
              {(currentStep === 3 || currentStep === 4) && (
                <Button
                  onClick={nextStep}
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-muted-foreground"
                  data-testid="onboarding-next-btn"
                >
                  Avançar
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </WizardCard>

        {/* Link de saída (fora do card) */}
        {currentStep === 0 && null /* as ações ficam dentro do StepWelcome */}
      </div>
    </>
  );
}
