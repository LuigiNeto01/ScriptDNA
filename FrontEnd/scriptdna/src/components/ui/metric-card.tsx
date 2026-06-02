import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ElementType;
  trend?: {
    value: number;
    label?: string;
  };
  loading?: boolean;
  className?: string;
}

/**
 * MetricCard — card reutilizável de métrica numérica.
 * Substitui os componentes locais MetricCard e SummaryCard
 * que existiam duplicados em múltiplas páginas.
 */
export function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  loading = false,
  className,
}: MetricCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2 py-1">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Carregando...</span>
          </div>
        ) : (
          <>
            <div className="truncate text-2xl font-bold">{value}</div>
            {trend != null && (
              <p
                className={cn(
                  "mt-0.5 text-xs font-medium",
                  trend.value >= 0 ? "text-emerald-500" : "text-destructive"
                )}
              >
                {trend.value >= 0 ? "+" : ""}
                {trend.value}%{trend.label ? ` ${trend.label}` : ""}
              </p>
            )}
            {description && (
              <p className="mt-1 text-xs text-muted-foreground">{description}</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
