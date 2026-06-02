import { z } from "zod";

export const generateSchema = z.object({
  theme: z.string().min(1, "Tema obrigatório"),
  idea: z.string().max(2000).optional(),
  duration: z.number().min(15).max(600),
  platform: z.string().optional(),
  niche: z.string().min(1, "Nicho obrigatório"),
  goal: z.string().optional(),
  style_profile_id: z.string().optional(),
  aggressiveness: z.number().min(1).max(10),
  hook_type: z.string().min(1, "Tipo de hook obrigatório"),
  cta: z.string().optional(),
  variants: z.number().min(1).max(5),
  save: z.boolean(),
});

export type GenerateFormData = z.infer<typeof generateSchema>;

export const hookTypes: { value: string; label: string; description: string }[] = [
  {
    value: "curiosity_gap",
    label: "Lacuna de Curiosidade",
    description: "Cria uma pergunta que o espectador precisa responder",
  },
  {
    value: "pattern_interrupt",
    label: "Quebra de Padrão",
    description: "Surpreende com algo inesperado nos primeiros segundos",
  },
  {
    value: "bold_claim",
    label: "Afirmação Ousada",
    description: "Abre com uma declaração forte e provocativa",
  },
  {
    value: "question",
    label: "Pergunta Direta",
    description: "Faz uma pergunta que ressoa com o público",
  },
  {
    value: "story",
    label: "Mini-história",
    description: "Começa com um trecho narrativo envolvente",
  },
  {
    value: "statistic",
    label: "Dado Chocante",
    description: "Abre com um número ou estatística impactante",
  },
  {
    value: "controversial",
    label: "Opinião Controversa",
    description: "Desafia o senso comum para gerar engajamento",
  },
];

export const aggressivenessLabels: Record<number, string> = {
  1: "Sutil",
  2: "Leve",
  3: "Moderado",
  4: "Moderado",
  5: "Equilibrado",
  6: "Direto",
  7: "Intenso",
  8: "Agressivo",
  9: "Muito agressivo",
  10: "Máximo",
};

export const DURATION_PRESETS = [
  { label: "15s", value: 15 },
  { label: "30s", value: 30 },
  { label: "60s", value: 60 },
  { label: "90s", value: 90 },
  { label: "3min", value: 180 },
] as const;
