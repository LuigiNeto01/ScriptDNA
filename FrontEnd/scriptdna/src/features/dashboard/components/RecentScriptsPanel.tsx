import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/link-button";
import { AlertCircle, FileText, Loader2 } from "lucide-react";
import { formatScriptStatus } from "@/lib/formatters";
import type { Script } from "@/types/api";

interface RecentScriptsPanelProps {
  scripts: Script[];
  isLoading: boolean;
  isError: boolean;
}

export function RecentScriptsPanel({ scripts, isLoading, isError }: RecentScriptsPanelProps) {
  return (
    <Card data-testid="recent-scripts-panel">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>Roteiros Recentes</CardTitle>
            <CardDescription>Seus últimos roteiros criados</CardDescription>
          </div>
          <LinkButton href="/scripts" variant="outline" size="sm">
            Ver todos
          </LinkButton>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <div className="flex items-center gap-2 py-4 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span>Erro ao carregar roteiros</span>
          </div>
        ) : !scripts.length ? (
          <div className="py-8 text-center">
            <FileText className="h-8 w-8 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium">Nenhum roteiro ainda</p>
            <p className="text-xs text-muted-foreground mt-1">
              Crie um roteiro para iniciar o ciclo de melhoria.
            </p>
            <LinkButton href="/generate" size="sm" className="mt-3">
              Criar roteiro
            </LinkButton>
          </div>
        ) : (
          <div className="space-y-2">
            {scripts.slice(0, 5).map((script) => (
              <Link
                key={script.id}
                href={`/scripts/${script.id}`}
                className="flex flex-col gap-2 rounded-lg border p-3 transition-colors hover:bg-accent sm:flex-row sm:items-center sm:justify-between"
                data-testid="recent-script-item"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{script.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {script.niche ?? "Sem nicho"} ·{" "}
                    {script.estimated_duration_seconds
                      ? `${script.estimated_duration_seconds}s`
                      : "—"}{" "}
                    · {new Date(script.updated_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <Badge className="w-fit" variant="outline">
                  {formatScriptStatus(script.status)}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
