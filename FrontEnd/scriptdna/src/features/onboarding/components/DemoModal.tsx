"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, BarChart3, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DemoModalProps {
  open: boolean;
  onClose: () => void;
}

// ─── Dados de exemplo (estáticos, claramente marcados como demo) ───────────

const DEMO_SCRIPT = [
  {
    time: "0–3s",
    type: "Gancho",
    line: "Você provavelmente está cometendo esse erro no seu canal — e nem sabe disso.",
    note: "Provoca curiosidade sem revelar o conteúdo ainda",
  },
  {
    time: "3–8s",
    type: "Conflito",
    line: "A maioria dos criadores posta consistentemente por meses e ainda não vê crescimento. O motivo é sempre o mesmo.",
    note: "Cria identificação com o problema",
  },
  {
    time: "8–18s",
    type: "Desenvolvimento",
    line: "O problema não é a frequência — é que cada vídeo recomeça do zero. Sem aprender com o que funcionou antes.",
    note: "Apresenta a causa raiz",
  },
  {
    time: "18–25s",
    type: "Virada",
    line: "Quando você analisa os 3 segundos onde o público parou de assistir, você nunca mais comete o mesmo erro.",
    note: "Revelação do insight principal",
  },
  {
    time: "25–30s",
    type: "CTA",
    line: "Salva esse vídeo. Você vai querer rever quando for criar seu próximo roteiro.",
    note: "CTA de salvamento (alto engajamento)",
  },
];

const DEMO_INSIGHTS = [
  {
    label: "Retenção média",
    value: "68%",
    trend: "+12%",
    positive: true,
    description: "Seus Shorts retêm acima da média do nicho",
  },
  {
    label: "Melhor gancho",
    value: "Perguntas diretas",
    trend: null,
    description: "Vídeos com pergunta nos 3s iniciais retêm 23% mais",
  },
  {
    label: "Pior momento",
    value: "Segundo 8",
    trend: null,
    description: "Queda média de 18% neste ponto em 7 de 10 vídeos",
  },
];

/**
 * DemoModal — exibe um exemplo estático de como o ScriptDNA funciona.
 * Claramente marcado como "EXEMPLO" para não confundir com dados reais.
 */
export function DemoModal({ open, onClose }: DemoModalProps) {
  const [activeTab, setActiveTab] = useState<"script" | "insights">("script");

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>Como funciona na prática</DialogTitle>
            <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
              Exemplo
            </Badge>
          </div>
          <DialogDescription>
            Estes são dados fictícios para ilustrar o que o ScriptDNA gera. Não representam seu canal.
          </DialogDescription>
        </DialogHeader>

        {/* Banner de aviso */}
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>
            <strong>Dados de exemplo.</strong> Após configurar sua conta, o ScriptDNA usará seus dados reais.
          </span>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-lg border bg-muted/40 p-1">
          {[
            { id: "script" as const, label: "Roteiro gerado", icon: Sparkles },
            { id: "insights" as const, label: "Aprendizados", icon: TrendingUp },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all",
                activeTab === tab.id
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Conteúdo */}
        {activeTab === "script" ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>Roteiro de 30s — Nicho: Produtividade</span>
            </div>
            {DEMO_SCRIPT.map((line, i) => (
              <div
                key={i}
                className="rounded-lg border bg-card p-3 space-y-1.5"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] h-5">
                    {line.time}
                  </Badge>
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-primary">
                    {line.type}
                  </span>
                </div>
                <p className="text-sm font-medium leading-snug">{line.line}</p>
                <p className="text-xs text-muted-foreground italic">{line.note}</p>
              </div>
            ))}
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
              <strong className="text-foreground">Análise de qualidade:</strong> Força do gancho: 87% · 
              Ganchos de curiosidade: 3 · Ponto fraco: payoff poderia ser mais direto
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <BarChart3 className="h-3.5 w-3.5" />
              <span>Baseado em 12 Shorts analisados — exemplo fictício</span>
            </div>
            {DEMO_INSIGHTS.map((insight, i) => (
              <div
                key={i}
                className="flex items-start gap-4 rounded-lg border bg-card p-4"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                    {insight.label}
                  </p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-lg font-bold">{insight.value}</span>
                    {insight.trend && (
                      <span
                        className={cn(
                          "text-xs font-medium",
                          insight.positive ? "text-emerald-500" : "text-destructive"
                        )}
                      >
                        {insight.trend}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button onClick={onClose} className="w-full sm:w-auto">
            Entendi — vamos configurar!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
