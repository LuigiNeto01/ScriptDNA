import { Card, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";

export function ReferenceSearchPanel({ isSearching }: { isSearching: boolean }) {
  return (
    <Card className="bg-muted/30">
      <CardContent className="flex items-start gap-3 py-4 text-sm text-muted-foreground">
        <Search className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          {isSearching
            ? "Busca ativa: mostrando referencias com trechos proximos ao que voce descreveu."
            : "Referencias sao videos, textos e links que a IA usa para entender estilo, ritmo, aberturas e estruturas antes de criar novos roteiros."}
        </p>
      </CardContent>
    </Card>
  );
}
