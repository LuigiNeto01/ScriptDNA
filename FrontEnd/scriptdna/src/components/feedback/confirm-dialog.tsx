"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  /** O trigger que abre o dialog (ex: botão de deletar) */
  trigger: React.ReactNode;
  /** Título do dialog */
  title?: string;
  /** Descrição / texto de confirmação */
  description?: string;
  /** Texto do botão de confirmação */
  confirmLabel?: string;
  /** Texto do botão de cancelar */
  cancelLabel?: string;
  /** Variante do botão de confirmação */
  confirmVariant?: "default" | "destructive" | "outline";
  /** Callback chamado quando o usuário confirma */
  onConfirm: () => void | Promise<void>;
  /** Se true, mostra spinner durante operação assíncrona */
  loading?: boolean;
}

/**
 * ConfirmDialog — substitui os confirm() nativos do browser.
 *
 * Usa Dialog do @base-ui/react com controle de estado manual (open/setOpen),
 * pois o @base-ui não suporta a prop `asChild` no DialogTrigger.
 *
 * O trigger é encapsulado num container clicável para abrir o dialog.
 *
 * Uso:
 * <ConfirmDialog
 *   trigger={<Button variant="ghost"><Trash2 /></Button>}
 *   title="Excluir roteiro?"
 *   description="Esta ação não pode ser desfeita."
 *   confirmLabel="Excluir"
 *   confirmVariant="destructive"
 *   onConfirm={() => deleteScript.mutate(script.id)}
 * />
 */
export function ConfirmDialog({
  trigger,
  title = "Confirmar ação",
  description = "Tem certeza que deseja continuar? Esta ação não pode ser desfeita.",
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  confirmVariant = "destructive",
  onConfirm,
  loading = false,
}: ConfirmDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const handleConfirm = useCallback(async () => {
    setIsPending(true);
    try {
      await onConfirm();
      setOpen(false);
    } finally {
      setIsPending(false);
    }
  }, [onConfirm]);

  return (
    <>
      {/* Trigger — encapsulado em div para interceptar clicks sem usar asChild */}
      <div
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        style={{ display: "contents" }}
        role="none"
      >
        {trigger}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <DialogTitle>{title}</DialogTitle>
            </div>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending || loading}
              className="flex-1 sm:flex-none"
            >
              {cancelLabel}
            </Button>
            <Button
              variant={confirmVariant}
              onClick={handleConfirm}
              disabled={isPending || loading}
              className="flex-1 sm:flex-none"
              data-testid="confirm-dialog-confirm"
            >
              {(isPending || loading) ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Aguarde...
                </span>
              ) : (
                confirmLabel
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
