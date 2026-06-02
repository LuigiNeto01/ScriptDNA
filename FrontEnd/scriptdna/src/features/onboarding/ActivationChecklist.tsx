import { CheckCircle2, Circle } from "lucide-react";
import { LinkButton } from "@/components/ui/link-button";
import { cn } from "@/lib/utils";

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  completed: boolean;
  href?: string;
  actionLabel?: string;
}

interface ActivationChecklistProps {
  items: ChecklistItem[];
  /** Se false, não exibe o checklist (usuário já completou tudo) */
  visible?: boolean;
}

/**
 * ActivationChecklist — checklist de ativação mostrado no dashboard.
 * Guia o usuário nos passos essenciais para tirar valor do ScriptDNA.
 */
export function ActivationChecklist({
  items,
  visible = true,
}: ActivationChecklistProps) {
  if (!visible) return null;

  const completedCount = items.filter((i) => i.completed).length;
  const allDone = completedCount === items.length;
  const progressPercent = Math.round((completedCount / items.length) * 100);

  if (allDone) return null;

  return (
    <div className="rounded-xl border bg-card p-5 space-y-4">
      {/* Header com progresso */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-sm">Configure sua conta</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {completedCount} de {items.length} passos concluídos
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">{progressPercent}%</span>
        </div>
      </div>

      {/* Itens */}
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              "flex items-start gap-3 rounded-lg p-3 transition-colors",
              item.completed
                ? "opacity-60"
                : "border bg-muted/30 hover:bg-muted/50"
            )}
          >
            {item.completed ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500 mt-0.5" />
            ) : (
              <Circle className="h-5 w-5 shrink-0 text-muted-foreground mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "text-sm font-medium",
                  item.completed && "line-through text-muted-foreground"
                )}
              >
                {item.label}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                {item.description}
              </p>
            </div>
            {!item.completed && item.href && (
              <LinkButton
                href={item.href}
                size="sm"
                variant="outline"
                className="shrink-0 text-xs h-7"
              >
                {item.actionLabel ?? "Fazer agora"}
              </LinkButton>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Hook de estado do checklist ────────────────────────────────────────────

interface ChecklistState {
  hasGoal: boolean;
  hasNiche: boolean;
  hasYouTube: boolean;
  hasShorts: boolean;
  hasReferences: boolean;
  hasScripts: boolean;
  hasInsights: boolean;
}

/**
 * Constrói os itens do checklist a partir do estado atual do usuário.
 */
export function buildActivationChecklist(
  state: Partial<ChecklistState>
): ChecklistItem[] {
  return [
    {
      id: "account",
      label: "Conta criada",
      description: "Você já criou sua conta no ScriptDNA.",
      completed: true,
    },
    {
      id: "goal",
      label: "Definir objetivo do canal",
      description: "Qual é sua meta principal agora? Views, retenção, inscritos...",
      completed: !!state.hasGoal,
      href: "/onboarding",
      actionLabel: "Definir",
    },
    {
      id: "niche",
      label: "Informar nicho do canal",
      description: "Sobre o que você cria conteúdo? Ajuda a IA a calibrar o estilo.",
      completed: !!state.hasNiche,
      href: "/onboarding",
      actionLabel: "Informar",
    },
    {
      id: "youtube",
      label: "Conectar canal do YouTube",
      description:
        "Necessário para importar seus Shorts e analisar métricas reais.",
      completed: !!state.hasYouTube,
      href: "/youtube",
      actionLabel: "Conectar",
    },
    {
      id: "shorts",
      label: "Importar 3 ou mais Shorts",
      description:
        "Quanto mais Shorts analisados, melhor a IA aprende seu padrão.",
      completed: !!state.hasShorts,
      href: "/youtube",
      actionLabel: "Ver Shorts",
    },
    {
      id: "references",
      label: "Adicionar vídeos de referência",
      description:
        "Roteiros de criadores que você admira ajudam a calibrar o estilo da IA.",
      completed: !!state.hasReferences,
      href: "/import",
      actionLabel: "Importar",
    },
    {
      id: "script",
      label: "Gerar seu primeiro roteiro",
      description: "Experimente gerar um roteiro com IA em menos de 2 minutos.",
      completed: !!state.hasScripts,
      href: "/generate",
      actionLabel: "Criar roteiro",
    },
    {
      id: "insights",
      label: "Explorar seus aprendizados",
      description:
        "Veja o que a IA descobriu sobre o que funciona no seu canal.",
      completed: !!state.hasInsights,
      href: "/insights",
      actionLabel: "Ver aprendizados",
    },
  ];
}
