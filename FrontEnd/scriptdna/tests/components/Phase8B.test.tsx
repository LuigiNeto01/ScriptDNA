import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../helpers";
import { CommentSummaryCard } from "@/components/comments/comment-summary-card";
import { CommentList } from "@/components/comments/comment-list";
import { ExperimentList } from "@/components/experiments/experiment-list";
import { TrendCards } from "@/components/strategy/trend-cards";
import type {
  CommentSummary,
  YouTubeShortComment,
  ScriptExperiment,
  InternalTrend,
} from "@/types/api";

// ============================================================
// Mock Data
// ============================================================

const mockCommentSummary: CommentSummary = {
  total_comments: 15,
  analyzed_comments: 12,
  avg_sentiment_score: 0.65,
  sentiment_distribution: { positive: 8, negative: 2, neutral: 2 },
  intent_distribution: { praise: 6, question: 3, suggestion: 2, spam: 1 },
};

const mockComments: YouTubeShortComment[] = [
  {
    id: "c1",
    youtube_comment_id: "yt-c1",
    author_name: "TestUser",
    text: "Muito bom esse video!",
    like_count: 5,
    published_at: "2026-06-01T14:00:00Z",
    sentiment: "positive",
    sentiment_score: 0.9,
    intent: "praise",
    topics: ["humor", "editing"],
    actionable_insight: null,
    analyzed_at: "2026-06-01T15:00:00Z",
  },
  {
    id: "c2",
    youtube_comment_id: "yt-c2",
    author_name: "CriticUser",
    text: "O audio poderia ser melhor",
    like_count: 2,
    published_at: "2026-06-01T13:00:00Z",
    sentiment: "negative",
    sentiment_score: -0.5,
    intent: "complaint",
    topics: ["audio"],
    actionable_insight: "Melhorar qualidade do audio",
    analyzed_at: "2026-06-01T15:00:00Z",
  },
];

const mockExperiments: ScriptExperiment[] = [
  {
    id: "exp-1",
    name: "Hook: pergunta vs afirmacao",
    hypothesis: "Perguntas geram mais retencao",
    status: "completed",
    variant_a_script_id: "s1",
    variant_b_script_id: "s2",
    variant_a_short_id: null,
    variant_b_short_id: null,
    winner: "a",
    result_summary: "Variante A teve 15% mais retencao",
    metrics_comparison: null,
    started_at: "2026-05-28T10:00:00Z",
    completed_at: "2026-06-01T10:00:00Z",
    created_at: "2026-05-27T10:00:00Z",
  },
  {
    id: "exp-2",
    name: "CTA: inscricao vs compartilhamento",
    hypothesis: null,
    status: "draft",
    variant_a_script_id: null,
    variant_b_script_id: null,
    variant_a_short_id: null,
    variant_b_short_id: null,
    winner: null,
    result_summary: null,
    metrics_comparison: null,
    started_at: null,
    completed_at: null,
    created_at: "2026-06-01T10:00:00Z",
  },
];

const mockTrends: InternalTrend[] = [
  {
    metric: "views",
    direction: "up",
    change_percent: 25.3,
    recent_value: 5000,
    baseline_avg: 3990,
  },
  {
    metric: "engagement_rate",
    direction: "down",
    change_percent: -12.5,
    recent_value: 4.2,
    baseline_avg: 4.8,
  },
];

// ============================================================
// CommentSummaryCard
// ============================================================

describe("CommentSummaryCard", () => {
  it("renders empty state when no data", () => {
    renderWithProviders(<CommentSummaryCard data={undefined} />);
    expect(screen.getByText("Nenhum comentario encontrado")).toBeDefined();
  });

  it("renders comment summary data", () => {
    renderWithProviders(<CommentSummaryCard data={mockCommentSummary} />);
    expect(screen.getByText("15")).toBeDefined();
    expect(screen.getByText("12")).toBeDefined();
    expect(screen.getByText("0.65")).toBeDefined();
  });

  it("shows sentiment distribution", () => {
    renderWithProviders(<CommentSummaryCard data={mockCommentSummary} />);
    expect(screen.getByText("positive: 8")).toBeDefined();
    expect(screen.getByText("negative: 2")).toBeDefined();
  });

  it("shows intent distribution", () => {
    renderWithProviders(<CommentSummaryCard data={mockCommentSummary} />);
    expect(screen.getByText("Elogio: 6")).toBeDefined();
    expect(screen.getByText("Pergunta: 3")).toBeDefined();
  });
});

// ============================================================
// CommentList
// ============================================================

describe("CommentList", () => {
  it("renders loading state", () => {
    renderWithProviders(
      <CommentList data={undefined} isLoading={true} isError={false} />
    );
    expect(document.querySelector(".animate-spin")).toBeDefined();
  });

  it("renders error state", () => {
    renderWithProviders(
      <CommentList data={undefined} isLoading={false} isError={true} />
    );
    expect(screen.getByText("Erro ao carregar comentarios")).toBeDefined();
  });

  it("renders empty state", () => {
    renderWithProviders(
      <CommentList data={[]} isLoading={false} isError={false} />
    );
    expect(screen.getByText("Nenhum comentario encontrado")).toBeDefined();
  });

  it("renders comment data with badges", () => {
    renderWithProviders(
      <CommentList data={mockComments} isLoading={false} isError={false} />
    );
    expect(screen.getByText("TestUser")).toBeDefined();
    expect(screen.getByText("Muito bom esse video!")).toBeDefined();
    expect(screen.getByText("Positivo")).toBeDefined();
    expect(screen.getByText("Negativo")).toBeDefined();
  });

  it("shows topics as badges", () => {
    renderWithProviders(
      <CommentList data={mockComments} isLoading={false} isError={false} />
    );
    expect(screen.getByText("humor")).toBeDefined();
    expect(screen.getByText("audio")).toBeDefined();
  });

  it("shows actionable insights", () => {
    renderWithProviders(
      <CommentList data={mockComments} isLoading={false} isError={false} />
    );
    expect(
      screen.getByText("Insight: Melhorar qualidade do audio")
    ).toBeDefined();
  });
});

// ============================================================
// ExperimentList
// ============================================================

describe("ExperimentList", () => {
  it("renders loading state", () => {
    renderWithProviders(
      <ExperimentList data={undefined} isLoading={true} isError={false} />
    );
    expect(document.querySelector(".animate-spin")).toBeDefined();
  });

  it("renders error state", () => {
    renderWithProviders(
      <ExperimentList data={undefined} isLoading={false} isError={true} />
    );
    expect(screen.getByText("Erro ao carregar experimentos")).toBeDefined();
  });

  it("renders empty state", () => {
    renderWithProviders(
      <ExperimentList data={[]} isLoading={false} isError={false} />
    );
    expect(screen.getByText("Nenhum experimento criado")).toBeDefined();
  });

  it("renders experiment data", () => {
    renderWithProviders(
      <ExperimentList data={mockExperiments} isLoading={false} isError={false} />
    );
    expect(screen.getByText("Hook: pergunta vs afirmacao")).toBeDefined();
    expect(screen.getByText("CTA: inscricao vs compartilhamento")).toBeDefined();
    expect(screen.getByText("Concluido")).toBeDefined();
    expect(screen.getByText("Rascunho")).toBeDefined();
  });

  it("shows winner when experiment is completed", () => {
    renderWithProviders(
      <ExperimentList data={mockExperiments} isLoading={false} isError={false} />
    );
    expect(screen.getByText("Variante A venceu")).toBeDefined();
    expect(
      screen.getByText("Variante A teve 15% mais retencao")
    ).toBeDefined();
  });
});

// ============================================================
// TrendCards
// ============================================================

describe("TrendCards", () => {
  it("renders loading state", () => {
    renderWithProviders(
      <TrendCards data={undefined} isLoading={true} isError={false} />
    );
    expect(document.querySelector(".animate-spin")).toBeDefined();
  });

  it("renders error state", () => {
    renderWithProviders(
      <TrendCards data={undefined} isLoading={false} isError={true} />
    );
    expect(screen.getByText("Erro ao carregar tendencias")).toBeDefined();
  });

  it("renders empty state", () => {
    renderWithProviders(
      <TrendCards data={[]} isLoading={false} isError={false} />
    );
    expect(screen.getByText("Nenhuma tendencia detectada")).toBeDefined();
  });

  it("renders trend data", () => {
    renderWithProviders(
      <TrendCards data={mockTrends} isLoading={false} isError={false} />
    );
    expect(screen.getByText("Views")).toBeDefined();
    expect(screen.getByText("Engajamento")).toBeDefined();
    expect(screen.getByText("+25.3%")).toBeDefined();
    expect(screen.getByText("-12.5%")).toBeDefined();
  });
});
