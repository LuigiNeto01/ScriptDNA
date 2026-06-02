"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CommentList } from "@/components/comments/comment-list";
import { CommentSummaryCard } from "@/components/comments/comment-summary-card";
import { useAnalyzeComments, useCommentSummary, useComments, useFetchComments } from "@/hooks/use-comments";
import { Loader2, MessageCircle, Sparkles } from "lucide-react";

export function ShortCommentsPanel({ shortId }: { shortId: string }) {
  const comments = useComments(shortId, { limit: 10 });
  const summary = useCommentSummary(shortId);
  const fetchComments = useFetchComments(shortId);
  const analyzeComments = useAnalyzeComments(shortId);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Comentarios e publico</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Comentarios ajudam a identificar duvidas frequentes, pedidos de conteudo, confusoes e criticas.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => fetchComments.mutate()} disabled={fetchComments.isPending}>
              {fetchComments.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
              Buscar comentarios
            </Button>
            <Button variant="outline" size="sm" onClick={() => analyzeComments.mutate()} disabled={analyzeComments.isPending}>
              {analyzeComments.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Analisar comentarios
            </Button>
          </div>
        </CardContent>
      </Card>
      <CommentSummaryCard data={summary.data} />
      <CommentList data={comments.data} isLoading={comments.isLoading} isError={comments.isError} />
    </div>
  );
}
