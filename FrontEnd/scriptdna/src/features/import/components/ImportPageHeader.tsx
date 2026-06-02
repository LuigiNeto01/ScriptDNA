import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Video } from "lucide-react";

export function ImportPageHeader() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Adicionar referencia</h1>
        <p className="max-w-2xl text-muted-foreground">
          Referencias ajudam a IA a aprender estilo, ritmo, aberturas e estruturas que voce quer usar nos seus roteiros.
        </p>
      </div>
      <Link href="/youtube">
        <Button variant="outline">
          <Video className="h-4 w-4" />
          Sincronizar Shorts
        </Button>
      </Link>
    </div>
  );
}
