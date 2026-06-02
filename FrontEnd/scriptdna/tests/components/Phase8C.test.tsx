import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../helpers";
import { mockShort, mockShortWithScriptLink } from "../mocks/handlers";
import { ShortCard } from "@/features/youtube/components/ShortCard";
import { ShortNextStepCard } from "@/features/youtube-short/components/ShortNextStepCard";
import { ShortScriptLinkCard } from "@/features/youtube-short/components/ShortScriptLinkCard";
import type { PerformanceAnalysis } from "@/types/api";

const analysis: PerformanceAnalysis = {
  id: "analysis-001",
  youtube_short_id: "short-001",
  script_id: "script-001",
  scores: {
    hook: 0.8,
    rhythm: 0.7,
    curiosity: 0.6,
    retention: 0.75,
    clarity: 0.8,
    promise_delivery: 0.7,
    cta: 0.5,
    narrative: 0.8,
    overall: 0.76,
  },
  strengths: [],
  weaknesses: [],
  actionable_learnings: [],
  script_correlation: [],
  script_adherence: null,
  timeline_analysis: null,
  beat_scores: null,
  created_at: "2026-06-01T10:00:00Z",
};

describe("Phase 8C components", () => {
  it("renders aggregated short info without extra queries", () => {
    renderWithProviders(<ShortCard short={mockShortWithScriptLink} />);
    expect(screen.getByText("Rascunho")).toBeInTheDocument();
    expect(screen.getByText("Transcrito")).toBeInTheDocument();
    expect(screen.getByText("5.2K views")).toBeInTheDocument();
  });

  it("shows link next step when analysis exists but no script is linked", () => {
    renderWithProviders(
      <ShortNextStepCard short={mockShort} analysis={analysis} onFetchTranscript={vi.fn()} onAnalyze={vi.fn()} />
    );
    expect(screen.getByText("Vincular roteiro")).toBeInTheDocument();
    expect(screen.getByText("Vincule um roteiro na lateral")).toBeInTheDocument();
  });

  it("opens dialog with scripts to link", async () => {
    renderWithProviders(<ShortScriptLinkCard short={mockShort} />);
    fireEvent.click(screen.getByText("Vincular roteiro"));
    expect(await screen.findByPlaceholderText("Buscar roteiro")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText("Minecraft Hooks Test")).toBeInTheDocument();
    });
  });

  it("shows linked script actions", () => {
    renderWithProviders(<ShortScriptLinkCard short={mockShortWithScriptLink} />);
    expect(screen.getByText("Abrir roteiro")).toBeInTheDocument();
    expect(screen.getByText("Alterar")).toBeInTheDocument();
  });
});
