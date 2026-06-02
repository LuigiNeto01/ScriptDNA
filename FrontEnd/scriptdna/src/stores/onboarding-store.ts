import { create } from "zustand";
import { persist } from "zustand/middleware";

export type OnboardingGoal =
  | "views"
  | "retention"
  | "subscribers"
  | "comments"
  | "conversions"
  | "consistency";

export interface OnboardingState {
  /** Se o wizard foi concluído */
  completed: boolean;
  /** Etapa atual (0 = boas-vindas, 5 = CTA final) */
  currentStep: number;
  /** Objetivo principal do canal */
  goal?: OnboardingGoal;
  /** Nicho do canal */
  niche?: string;
  /** Usuário pulou a etapa do YouTube */
  skippedYoutube: boolean;
  /** Usuário pulou a etapa de referências */
  skippedReferences: boolean;
  /** Timestamp de quando o wizard foi iniciado */
  startedAt?: string;
  /** Timestamp de quando o wizard foi concluído */
  completedAt?: string;

  // ── Ações ────────────────────────────────────────────────────
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setGoal: (goal: OnboardingGoal) => void;
  setNiche: (niche: string) => void;
  skipYoutube: () => void;
  skipReferences: () => void;
  complete: () => void;
  reset: () => void;
}

/** Número total de etapas do wizard */
export const ONBOARDING_TOTAL_STEPS = 6;

/** Labels das etapas (para exibição) */
export const ONBOARDING_STEP_LABELS = [
  "Boas-vindas",
  "Objetivo",
  "Nicho",
  "YouTube",
  "Referências",
  "Primeiro roteiro",
] as const;

/** Goals disponíveis com labels amigáveis */
export const GOAL_OPTIONS: { value: OnboardingGoal; label: string; description: string }[] = [
  {
    value: "views",
    label: "Mais visualizações",
    description: "Alcançar mais pessoas com meus Shorts",
  },
  {
    value: "retention",
    label: "Mais retenção",
    description: "Fazer as pessoas assistirem até o final",
  },
  {
    value: "subscribers",
    label: "Mais inscritos",
    description: "Converter visualizações em fãs do canal",
  },
  {
    value: "comments",
    label: "Mais comentários",
    description: "Gerar mais engajamento e discussão",
  },
  {
    value: "conversions",
    label: "Mais conversões",
    description: "Direcionar para produtos, links ou ações",
  },
  {
    value: "consistency",
    label: "Mais consistência",
    description: "Criar conteúdo de qualidade de forma regular",
  },
];

/** Sugestões de nicho para os chips */
export const NICHE_SUGGESTIONS = [
  "Minecraft",
  "Inteligência Artificial",
  "Produtividade",
  "Finanças",
  "Humor",
  "Educação",
  "Tecnologia",
  "Programação",
  "Lifestyle",
] as const;

const initialState = {
  completed: false,
  currentStep: 0,
  goal: undefined,
  niche: undefined,
  skippedYoutube: false,
  skippedReferences: false,
  startedAt: undefined,
  completedAt: undefined,
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setStep: (step) =>
        set({
          currentStep: Math.max(0, Math.min(step, ONBOARDING_TOTAL_STEPS - 1)),
        }),

      nextStep: () => {
        const current = get().currentStep;
        if (current === 0 && !get().startedAt) {
          set({ startedAt: new Date().toISOString() });
        }
        set({
          currentStep: Math.min(current + 1, ONBOARDING_TOTAL_STEPS - 1),
        });
      },

      prevStep: () =>
        set((state) => ({
          currentStep: Math.max(state.currentStep - 1, 0),
        })),

      setGoal: (goal) => set({ goal }),

      setNiche: (niche) => set({ niche: niche.trim() }),

      skipYoutube: () => {
        set({ skippedYoutube: true });
        get().nextStep();
      },

      skipReferences: () => {
        set({ skippedReferences: true });
        get().nextStep();
      },

      complete: () =>
        set({
          completed: true,
          completedAt: new Date().toISOString(),
          currentStep: ONBOARDING_TOTAL_STEPS - 1,
        }),

      reset: () => set(initialState),
    }),
    {
      name: "scriptdna-onboarding",
      // Persiste tudo menos as funções
      partialize: (state) => ({
        completed: state.completed,
        currentStep: state.currentStep,
        goal: state.goal,
        niche: state.niche,
        skippedYoutube: state.skippedYoutube,
        skippedReferences: state.skippedReferences,
        startedAt: state.startedAt,
        completedAt: state.completedAt,
      }),
    }
  )
);

// ── Selectors ──────────────────────────────────────────────────────────────

/** Quantos passos foram concluídos (0–6) */
export function useOnboardingProgress() {
  const store = useOnboardingStore();
  if (store.completed) return ONBOARDING_TOTAL_STEPS;
  return store.currentStep;
}

/** Percentual de conclusão (0–100) */
export function useOnboardingPercent() {
  const progress = useOnboardingProgress();
  return Math.round((progress / ONBOARDING_TOTAL_STEPS) * 100);
}
