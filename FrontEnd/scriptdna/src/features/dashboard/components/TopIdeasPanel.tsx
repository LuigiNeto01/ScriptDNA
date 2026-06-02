import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/link-button";
import { Loader2, Sparkles } from "lucide-react";
import type { VideoSuggestion } from "@/types/api";

interface TopIdeasPanelProps {
  items: VideoSuggestion[];
  isLoading: boolean;
}

export function TopIdeasPanel({ items, isLoading }: TopIdeasPanelProps) {
  return (
    <Card data-testid="top-ideas-panel">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle>Próximos Vídeos</CardTitle>
            <CardDescription>Ideias geradas pela IA</CardDescription>
          </div>
          <LinkButton href="/ideas" variant="ghost" size="sm">
            Ver todas
          </LinkButton>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : !items.length ? (
          <div className="py-6 text-center">
            <Sparkles className="h-7 w-7 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-xs text-muted-foreground">
              Analise seus Shorts para receber sugestões de novos vídeos.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((suggestion) => (
              <Link
                key={suggestion.id}
                href="/ideas"
                className="block rounded-lg border p-3 transition-colors hover:bg-accent"
                data-testid="top-idea-item"
              >
                <p className="line-clamp-2 text-sm font-medium">{suggestion.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {suggestion.confidence_score != null
                    ? `${Math.round(suggestion.confidence_score * 100)}% de confiança`
                    : ""}
                </p>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
