import { PenTool, Upload } from "lucide-react";
import { LinkButton } from "@/components/ui/link-button";

interface DashboardPageHeaderProps {
  greeting: string;
}

export function DashboardPageHeader({ greeting }: DashboardPageHeaderProps) {
  return (
    <div
      className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      data-testid="dashboard-header"
    >
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{greeting}</h1>
        <p className="text-muted-foreground">
          Visão geral do ciclo gerar, publicar, medir e aprender.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <LinkButton href="/generate" data-testid="dashboard-create-btn">
          <PenTool className="mr-2 h-4 w-4" />
          Criar Roteiro
        </LinkButton>
        <LinkButton href="/import" variant="outline" data-testid="dashboard-import-btn">
          <Upload className="mr-2 h-4 w-4" />
          Importar
        </LinkButton>
      </div>
    </div>
  );
}
