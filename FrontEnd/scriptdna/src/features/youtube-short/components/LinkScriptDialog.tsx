"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useScripts } from "@/hooks/use-scripts";
import { formatScriptStatus } from "@/lib/formatters";
import { Loader2, Link2, Search } from "lucide-react";

interface LinkScriptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectScript: (scriptId: string) => void;
  isPending: boolean;
  currentScriptId?: string | null;
}

export function LinkScriptDialog({
  open,
  onOpenChange,
  onSelectScript,
  isPending,
  currentScriptId,
}: LinkScriptDialogProps) {
  const [query, setQuery] = useState("");
  const scripts = useScripts({ q: query, limit: 8 });

  const visibleScripts = useMemo(
    () => (scripts.data ?? []).filter((script) => script.id !== currentScriptId),
    [currentScriptId, scripts.data]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Vincular roteiro</DialogTitle>
          <DialogDescription>
            Busque um roteiro pelo titulo, tema ou nicho para conectar este Short com o contexto certo.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar roteiro"
            className="pl-9"
          />
        </div>

        <ScrollArea className="h-72 rounded-md border">
          <div className="space-y-2 p-3">
            {scripts.isLoading ? (
              <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Carregando roteiros...
              </div>
            ) : scripts.isError ? (
              <div className="py-10 text-center text-sm text-destructive">
                Nao conseguimos carregar os roteiros agora.
              </div>
            ) : visibleScripts.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                Nenhum roteiro apareceu nessa busca.
              </div>
            ) : (
              visibleScripts.map((script) => (
                <div
                  key={script.id}
                  className="flex items-center justify-between gap-3 rounded-md border p-3"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="truncate text-sm font-medium">{script.title}</p>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {script.theme ? <span>{script.theme}</span> : null}
                      {script.niche ? <span>{script.niche}</span> : null}
                      <Badge variant="outline" className="text-[10px]">
                        {formatScriptStatus(script.status)}
                      </Badge>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => onSelectScript(script.id)} disabled={isPending}>
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                  </Button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
