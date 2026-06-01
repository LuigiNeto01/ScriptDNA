"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Loader2, AlertCircle, MessageCircle } from "lucide-react";
import type { YouTubeShortComment } from "@/types/api";

const SENTIMENT_BADGE: Record<string, { label: string; variant: "default" | "destructive" | "outline" | "secondary" }> = {
  positive: { label: "Positivo", variant: "default" },
  negative: { label: "Negativo", variant: "destructive" },
  neutral: { label: "Neutro", variant: "secondary" },
  mixed: { label: "Misto", variant: "outline" },
};

const INTENT_BADGE: Record<string, string> = {
  praise: "Elogio",
  question: "Pergunta",
  suggestion: "Sugestao",
  complaint: "Reclamacao",
  engagement: "Engajamento",
  spam: "Spam",
};

export function CommentList({
  data,
  isLoading,
  isError,
}: {
  data: YouTubeShortComment[] | undefined;
  isLoading: boolean;
  isError: boolean;
}) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 py-4 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <span>Erro ao carregar comentarios</span>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-muted-foreground">
          <MessageCircle className="mx-auto mb-2 h-8 w-8" />
          <p>Nenhum comentario encontrado</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comentarios</CardTitle>
        <CardDescription>{data.length} comentario{data.length > 1 ? "s" : ""}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((comment) => (
            <div
              key={comment.id}
              className="rounded-lg border p-3"
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-medium">
                  {comment.author_name || "Anonimo"}
                </span>
                <div className="flex items-center gap-1">
                  {comment.sentiment && SENTIMENT_BADGE[comment.sentiment] && (
                    <Badge variant={SENTIMENT_BADGE[comment.sentiment].variant} className="text-xs">
                      {SENTIMENT_BADGE[comment.sentiment].label}
                    </Badge>
                  )}
                  {comment.intent && (
                    <Badge variant="outline" className="text-xs">
                      {INTENT_BADGE[comment.intent] || comment.intent}
                    </Badge>
                  )}
                </div>
              </div>
              <p className="text-sm">{comment.text}</p>
              {comment.topics && comment.topics.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {comment.topics.map((topic) => (
                    <Badge key={topic} variant="secondary" className="text-xs">
                      {topic}
                    </Badge>
                  ))}
                </div>
              )}
              {comment.actionable_insight && (
                <p className="mt-1 text-xs text-blue-600">
                  Insight: {comment.actionable_insight}
                </p>
              )}
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                {comment.like_count > 0 && <span>{comment.like_count} likes</span>}
                {comment.published_at && (
                  <span>
                    {new Date(comment.published_at).toLocaleDateString("pt-BR")}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
