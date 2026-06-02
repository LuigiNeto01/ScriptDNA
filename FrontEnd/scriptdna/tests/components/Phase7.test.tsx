import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../helpers";
import { ShortCard } from "@/features/youtube/components/ShortCard";
import { ShortsFilterBar } from "@/features/youtube/components/ShortsFilterBar";
import { BeatPerformancePanel } from "@/features/youtube-short/components/BeatPerformancePanel";
import { ScriptAdherenceCard } from "@/features/youtube-short/components/ScriptAdherenceCard";
import { TimelineAnalysisView } from "@/features/youtube-short/components/TimelineAnalysisView";
import { ShortCommentsPanel } from "@/features/youtube-short/components/ShortCommentsPanel";
import { ShortNextStepCard } from "@/features/youtube-short/components/ShortNextStepCard";
import type { PerformanceAnalysis, TimelineAnalysis, YouTubeShort } from "@/types/api";

const short: YouTubeShort = {
  id: "short-001",
  youtube_video_id: "yt-001",
  title: "Short de teste",
  description: "Descricao",
  published_at: "2026-01-01T00:00:00Z",
  thumbnail_url: null,
  duration_seconds: 45,
  tags: ["teste"],
  transcript: "Esse e o texto falado no Short.",
  transcript_source: "manual",
  script_id: null,
  synced_at: null,
};

const analysis: PerformanceAnalysis = {
  id: "analysis-1",
  youtube_short_id: "short-001",
  script_id: null,
  scores: {
    hook: 0.8,
    rhythm: 0.7,
    curiosity: 0.6,
    retention: 0.9,
    clarity: 0.8,
    promise_delivery: 0.7,
    cta: 0.5,
    narrative: 0.8,
    overall: 0.8,
  },
  strengths: [],
  weaknesses: [],
  actionable_learnings: [{ learning: "Repita ganchos com promessa clara", priority: "high" }],
  script_correlation: [],
  script_adherence: null,
  timeline_analysis: null,
  beat_scores: null,
  created_at: "2026-01-01T00:00:00Z",
};

describe("Phase 7 components", () => {
  it("renders ShortCard with transcript and analyze CTA", async () => {
    renderWithProviders(<ShortCard short={short} />);
    expect(await screen.findByText("Short de teste")).toBeInTheDocument();
    expect(screen.getByText("Transcrito")).toBeInTheDocument();
    expect(screen.getByText("Analisar")).toBeInTheDocument();
  });

  it("renders ShortsFilterBar controls", () => {
    renderWithProviders(
      <ShortsFilterBar filter="all" sort="recent" onFilterChange={vi.fn()} onSortChange={vi.fn()} />
    );
    expect(screen.getByText("Analisados")).toBeInTheDocument();
    expect(screen.getByText("Sem transcricao")).toBeInTheDocument();
  });

  it("renders beat scores with friendly labels", () => {
    renderWithProviders(
      <BeatPerformancePanel scores={{ hook: 0.8, setup: 0.6, conflict: 0.7, escalation: 0.5, payoff: 0.9, cta: 0.4 }} />
    );
    expect(screen.getByText("Gancho inicial")).toBeInTheDocument();
    expect(screen.getByText(/Chamada para/i)).toBeInTheDocument();
  });

  it("renders script adherence explanation", () => {
    renderWithProviders(
      <ScriptAdherenceCard
        scriptId={null}
        adherence={{ script_adherence_score: 0.72, major_differences: ["Mudou a abertura"], missing_script_parts: [], new_unscripted_parts: [] }}
      />
    );
    expect(screen.getByText("O video seguiu o roteiro?")).toBeInTheDocument();
    expect(screen.getByText(/avaliar o roteiro original/i)).toBeInTheDocument();
  });

  it("renders timeline moments with friendly section titles", () => {
    const timeline: TimelineAnalysis = {
      timeline_score: 0.8,
      strong_moments: [{ start_time: 0, end_time: 5, reason: "Abertura clara", beat_type: "hook" }],
      drop_moments: [{ start_time: 20, end_time: 25, possible_reason: "Ritmo caiu", beat_type: "setup" }],
    };
    renderWithProviders(<TimelineAnalysisView timeline={timeline} />);
    expect(screen.getByText("Momentos que prenderam atencao")).toBeInTheDocument();
    expect(screen.getByText("Onde o publico saiu")).toBeInTheDocument();
  });

  it("renders comments panel actions", () => {
    renderWithProviders(<ShortCommentsPanel shortId="short-001" />);
    expect(screen.getByText("Comentarios e publico")).toBeInTheDocument();
    expect(screen.getByText("Buscar comentarios")).toBeInTheDocument();
    expect(screen.getByText("Analisar comentarios")).toBeInTheDocument();
  });

  it("renders next step for missing transcript", () => {
    renderWithProviders(
      <ShortNextStepCard short={{ ...short, transcript: null }} analysis={null} onFetchTranscript={vi.fn()} onAnalyze={vi.fn()} />
    );
    expect(screen.getAllByText("Buscar transcricao").length).toBeGreaterThan(0);
  });

  it("renders next step to generate script after analysis", () => {
    renderWithProviders(
      <ShortNextStepCard short={short} analysis={analysis} onFetchTranscript={vi.fn()} onAnalyze={vi.fn()} />
    );
    expect(screen.getByText("Criar proximo roteiro")).toBeInTheDocument();
    expect(screen.getByText("Gerar roteiro usando aprendizados")).toBeInTheDocument();
  });
});
