"use client";

import { useState } from "react";
import Link from "next/link";
import { useScripts, useDeleteScript } from "@/hooks/use-scripts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/link-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Plus, Loader2, AlertCircle, Trash2, Clock } from "lucide-react";
import type { ScriptStatus } from "@/types/api";

const STATUS_LABELS: Record<ScriptStatus, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  draft: { label: "Rascunho", variant: "secondary" },
  approved: { label: "Aprovado", variant: "default" },
  published: { label: "Publicado", variant: "default" },
  analyzed: { label: "Analisado", variant: "outline" },
  archived: { label: "Arquivado", variant: "destructive" },
};

export default function ScriptsPage() {
  const [statusFilter, setStatusFilter] = useState<ScriptStatus | "all">("all");
  const scripts = useScripts(statusFilter === "all" ? undefined : { status: statusFilter });
  const deleteScript = useDeleteScript();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Roteiros</h1>
          <p className="text-muted-foreground">Gerencie seus roteiros de Shorts</p>
        </div>
        <LinkButton href="/scripts/new">
          <Plus className="mr-2 h-4 w-4" />
          Novo Roteiro
        </LinkButton>
      </div>

      <div className="flex gap-2">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ScriptStatus | "all")}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="draft">Rascunho</SelectItem>
            <SelectItem value="approved">Aprovado</SelectItem>
            <SelectItem value="published">Publicado</SelectItem>
            <SelectItem value="analyzed">Analisado</SelectItem>
            <SelectItem value="archived">Arquivado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {scripts.isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : scripts.isError ? (
        <Card>
          <CardContent className="flex items-center gap-2 py-4 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span>Erro ao carregar roteiros</span>
          </CardContent>
        </Card>
      ) : !scripts.data?.length ? (
        <EmptyState
          icon={FileText}
          title="Nenhum roteiro"
          description="Crie seu primeiro roteiro para comecar."
          action={<LinkButton href="/scripts/new">Criar Roteiro</LinkButton>}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {scripts.data.map((script) => {
            const statusInfo = STATUS_LABELS[script.status];
            return (
              <Link key={script.id} href={`/scripts/${script.id}`}>
                <Card className="h-full transition-colors hover:bg-accent/50 cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base line-clamp-2">{script.title}</CardTitle>
                      <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                      {script.theme && <span>Tema: {script.theme}</span>}
                      {script.niche && <span>Nicho: {script.niche}</span>}
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{script.estimated_duration_seconds ? `${script.estimated_duration_seconds}s` : "—"}</span>
                      </div>
                      <span className="text-xs">
                        {new Date(script.updated_at).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (confirm("Deletar este roteiro?")) {
                            deleteScript.mutate(script.id);
                          }
                        }}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
