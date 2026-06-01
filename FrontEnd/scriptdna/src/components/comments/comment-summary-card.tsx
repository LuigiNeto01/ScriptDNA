"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, ThumbsUp, ThumbsDown, HelpCircle } from "lucide-react";
import type { CommentSummary } from "@/types/api";

const SENTIMENT_COLORS: Record<string, string> = {
  positive: "bg-green-100 text-green-800",
  negative: "bg-red-100 text-red-800",
  neutral: "bg-gray-100 text-gray-800",
  mixed: "bg-yellow-100 text-yellow-800",
};

const INTENT_LABELS: Record<string, string> = {
  praise: "Elogio",
  question: "Pergunta",
  suggestion: "Sugestao",
  complaint: "Reclamacao",
  engagement: "Engajamento",
  spam: "Spam",
};

export function CommentSummaryCard({ data }: { data: CommentSummary | undefined }) {
  if (!data || data.total_comments === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-muted-foreground">
          <MessageCircle className="mx-auto mb-2 h-8 w-8" />
          <p>Nenhum comentario encontrado</p>
        </CardContent>
      </Card>
    );
  }

  const sentimentIcon = () => {
    if (data.avg_sentiment_score == null) return <HelpCircle className="h-5 w-5" />;
    if (data.avg_sentiment_score > 0.2) return <ThumbsUp className="h-5 w-5 text-green-600" />;
    if (data.avg_sentiment_score < -0.2) return <ThumbsDown className="h-5 w-5 text-red-600" />;
    return <HelpCircle className="h-5 w-5 text-gray-500" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageCircle className="h-5 w-5" />
          Resumo de Comentarios
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="text-center">
            <div className="text-2xl font-bold">{data.total_comments}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{data.analyzed_comments}</div>
            <div className="text-xs text-muted-foreground">Analisados</div>
          </div>
          <div className="flex flex-col items-center">
            {sentimentIcon()}
            <div className="text-sm font-medium">
              {data.avg_sentiment_score != null
                ? data.avg_sentiment_score.toFixed(2)
                : "-"}
            </div>
            <div className="text-xs text-muted-foreground">Sentimento medio</div>
          </div>
        </div>

        {Object.keys(data.sentiment_distribution).length > 0 && (
          <div>
            <div className="mb-1 text-sm font-medium">Sentimento</div>
            <div className="flex flex-wrap gap-1">
              {Object.entries(data.sentiment_distribution).map(([key, count]) => (
                <Badge key={key} variant="outline" className={SENTIMENT_COLORS[key] || ""}>
                  {key}: {count}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {Object.keys(data.intent_distribution).length > 0 && (
          <div>
            <div className="mb-1 text-sm font-medium">Intencao</div>
            <div className="flex flex-wrap gap-1">
              {Object.entries(data.intent_distribution).map(([key, count]) => (
                <Badge key={key} variant="outline">
                  {INTENT_LABELS[key] || key}: {count}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
