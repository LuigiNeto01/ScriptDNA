import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface NextBestAction {
  label: string;
  href: string;
  icon: React.ElementType;
}

export function NextBestActionCard({ action }: { action: NextBestAction }) {
  return (
    <Link
      href={action.href}
      className="flex items-center gap-4 rounded-xl border bg-primary/5 border-primary/20 p-4 hover:bg-primary/10 transition-colors group"
      data-testid="next-best-action"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <action.icon className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary/70 mb-0.5">
          Próximo melhor passo
        </p>
        <p className="text-sm font-medium" data-testid="next-best-action-label">
          {action.label}
        </p>
      </div>
      <ArrowRight className="h-4 w-4 text-primary shrink-0 group-hover:translate-x-1 transition-transform" />
    </Link>
  );
}
