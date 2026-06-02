/**
 * lib/formatters.ts
 * Centralizador de funções de formatação para o ScriptDNA.
 * Substitui helpers locais duplicados em múltiplos arquivos de página.
 */

// ─── Números ─────────────────────────────────────────────────────────────────

/** Formata número grande de forma compacta (1.4K, 3.2M) */
export function formatCompactNumber(value: number | null | undefined): string {
  if (value == null) return "-";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return `${Math.round(value)}`;
}

/** Alias mais curto para formatCompactNumber */
export const formatNumber = formatCompactNumber;

/** Formata porcentagem com 1 casa decimal */
export function formatPercent(value: number | null | undefined): string {
  if (value == null) return "-";
  return `${value.toFixed(1)}%`;
}

/** Formata porcentagem inteira (sem decimal) */
export function formatPercentInt(value: number | null | undefined): string {
  if (value == null) return "-";
  return `${Math.round(value)}%`;
}

// ─── Duração / Tempo ──────────────────────────────────────────────────────────

/**
 * Formata duração em segundos como "1m30s" ou "45s"
 * Usado para exibir duração de vídeos/roteiros.
 */
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null) return "-";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const min = Math.floor(seconds / 60);
  const sec = Math.round(seconds % 60);
  return sec > 0 ? `${min}m${sec}s` : `${min}m`;
}

/**
 * Formata duração como "1:30" (relógio)
 * Usado para timelines e timestamps de vídeo.
 */
export function formatClock(seconds: number | null | undefined): string {
  if (seconds == null) return "-";
  const total = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(total / 60);
  const remainder = total % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

// ─── Moeda ────────────────────────────────────────────────────────────────────

/** Formata valor em dólares USD */
export function formatCurrencyUSD(value: number | null | undefined): string {
  if (value == null) return "-";
  if (value === 0) return "$0.00";
  return `$${value.toFixed(2)}`;
}

// ─── Data / Hora ──────────────────────────────────────────────────────────────

/** Formata data no padrão brasileiro DD/MM/AAAA */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("pt-BR");
}

/** Formata data e hora no padrão brasileiro DD/MM/AAAA HH:MM */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "-";
  return new Date(date).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Status de Tarefas (Tasks Celery) ────────────────────────────────────────

export type TaskStatusValue =
  | "pending"
  | "running"
  | "processing"
  | "success"
  | "done"
  | "error"
  | "failure"
  | string;

/**
 * Traduz o status técnico de uma task para linguagem amigável.
 * pending   → "Em fila"
 * running   → "Processando"
 * success   → "Concluído"
 * done      → "Concluído"
 * error     → "Falhou"
 * failure   → "Falhou"
 */
export function formatTaskStatus(status: TaskStatusValue | null | undefined): string {
  if (!status) return "Aguardando";
  const map: Record<string, string> = {
    pending: "Em fila",
    running: "Processando",
    processing: "Processando",
    transcribing: "Transcrevendo",
    analyzing: "Analisando",
    embedding: "Indexando",
    success: "Concluído",
    done: "Concluído",
    error: "Falhou",
    failure: "Falhou",
  };
  return map[status] ?? status;
}

/** Retorna variante de cor para o status da task */
export function formatTaskStatusVariant(
  status: TaskStatusValue | null | undefined
): "default" | "secondary" | "destructive" | "outline" {
  if (!status) return "secondary";
  if (status === "success" || status === "done") return "default";
  if (status === "error" || status === "failure") return "destructive";
  if (status === "pending") return "secondary";
  return "outline";
}

// ─── Nomes de Beats (partes do vídeo) ────────────────────────────────────────

export type BeatTypeName =
  | "hook"
  | "setup"
  | "conflict"
  | "escalation"
  | "payoff"
  | "cta";

/**
 * Traduz os tipos técnicos de beat para nomes amigáveis em português.
 * hook       → "Gancho inicial"
 * setup      → "Preparação"
 * conflict   → "Conflito"
 * escalation → "Escalada"
 * payoff     → "Entrega"
 * cta        → "Chamada para ação"
 */
export function formatBeatName(beatType: BeatTypeName | string): string {
  const map: Record<string, string> = {
    hook: "Gancho inicial",
    setup: "Preparação",
    conflict: "Conflito",
    escalation: "Escalada",
    payoff: "Entrega",
    cta: "Chamada para ação",
  };
  return map[beatType] ?? beatType;
}

// ─── Termos Técnicos → Linguagem Amigável ─────────────────────────────────────

const TECHNICAL_TERMS: Record<string, string> = {
  // Análise de vídeo
  beat_scores: "Desempenho por parte do vídeo",
  timeline_analysis: "Linha do tempo da retenção",
  context_snapshot: "Por que a IA gerou isso",
  script_adherence: "O vídeo seguiu o roteiro?",
  curiosity_gaps: "Ganchos de curiosidade",
  hook_strength: "Força do gancho inicial",
  intensity_score: "Intensidade emocional",
  aggressiveness: "Intensidade do tom",
  quality_evaluation: "Avaliação de qualidade",
  weak_points: "Pontos para melhorar",
  drop_moments: "Onde o público sai",
  strong_moments: "Momentos que prendem o público",
  retention_window: "Trecho de boa retenção",
  agent_runs: "Processamentos da IA",
  pattern_interrupt: "Quebra de expectativa",
  early_payoff: "Entrega prematura",
  copy_reference: "Risco de cópia",
  // Métricas
  impressions_ctr: "Taxa de cliques",
  average_view_percentage: "Retenção média (%)",
  subscribers_gained: "Novos inscritos",
  average_view_duration_seconds: "Duração média assistida",
  // Status de script
  ai_generation: "Gerado pela IA",
  ai_improvement: "Melhorado pela IA",
  user: "Manual",
};

/**
 * Converte um termo técnico para linguagem amigável.
 * Se não encontrar mapeamento, retorna o termo original.
 */
export function formatTechnicalTerm(term: string): string {
  return TECHNICAL_TERMS[term] ?? term;
}

// ─── Score / Análise ──────────────────────────────────────────────────────────

/**
 * Formata score de análise:
 * - se ≤ 1, é decimal (0 a 1) → converte para %
 * - se > 1, é nota (ex: 8.4/10) → exibe como X.X/10
 */
export function formatAnalysisScore(value: number | null | undefined): string {
  if (value == null) return "-";
  if (value <= 1) return `${Math.round(value * 100)}%`;
  return `${value.toFixed(1)}/10`;
}

// ─── Status de Script ─────────────────────────────────────────────────────────

export type ScriptStatusValue =
  | "draft"
  | "approved"
  | "published"
  | "analyzed"
  | "archived";

/** Traduz status de script para PT-BR amigável */
export function formatScriptStatus(status: ScriptStatusValue | string): string {
  const map: Record<string, string> = {
    draft: "Rascunho",
    approved: "Aprovado",
    published: "Publicado",
    analyzed: "Analisado",
    archived: "Arquivado",
  };
  return map[status] ?? status;
}
