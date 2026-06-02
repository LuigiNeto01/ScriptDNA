import { describe, it, expect } from "vitest";
import {
  formatNumber,
  formatCompactNumber,
  formatPercent,
  formatDuration,
  formatClock,
  formatCurrencyUSD,
  formatTaskStatus,
  formatTaskStatusVariant,
  formatBeatName,
  formatTechnicalTerm,
  formatAnalysisScore,
  formatScriptStatus,
} from "../formatters";

describe("formatCompactNumber / formatNumber", () => {
  it("returns '-' for null/undefined", () => {
    expect(formatCompactNumber(null)).toBe("-");
    expect(formatCompactNumber(undefined)).toBe("-");
    expect(formatNumber(null)).toBe("-");
  });
  it("formats millions", () => {
    expect(formatCompactNumber(1_500_000)).toBe("1.5M");
  });
  it("formats thousands", () => {
    expect(formatCompactNumber(2_400)).toBe("2.4K");
  });
  it("rounds small numbers", () => {
    expect(formatCompactNumber(123)).toBe("123");
  });
});

describe("formatPercent", () => {
  it("returns '-' for null/undefined", () => {
    expect(formatPercent(null)).toBe("-");
    expect(formatPercent(undefined)).toBe("-");
  });
  it("formats with 1 decimal", () => {
    expect(formatPercent(45.678)).toBe("45.7%");
    expect(formatPercent(0)).toBe("0.0%");
  });
});

describe("formatDuration", () => {
  it("returns '-' for null/undefined", () => {
    expect(formatDuration(null)).toBe("-");
    expect(formatDuration(undefined)).toBe("-");
  });
  it("formats seconds only", () => {
    expect(formatDuration(45)).toBe("45s");
    expect(formatDuration(59)).toBe("59s");
  });
  it("formats minutes and seconds", () => {
    expect(formatDuration(90)).toBe("1m30s");
    expect(formatDuration(120)).toBe("2m");
  });
});

describe("formatClock", () => {
  it("formats as MM:SS", () => {
    expect(formatClock(90)).toBe("1:30");
    expect(formatClock(65)).toBe("1:05");
    expect(formatClock(0)).toBe("0:00");
  });
  it("returns '-' for null/undefined", () => {
    expect(formatClock(null)).toBe("-");
  });
});

describe("formatCurrencyUSD", () => {
  it("returns '-' for null/undefined", () => {
    expect(formatCurrencyUSD(null)).toBe("-");
  });
  it("formats USD", () => {
    expect(formatCurrencyUSD(1.5)).toBe("$1.50");
    expect(formatCurrencyUSD(0)).toBe("$0.00");
  });
});

describe("formatTaskStatus", () => {
  it("translates pending to Em fila", () => {
    expect(formatTaskStatus("pending")).toBe("Em fila");
  });
  it("translates running to Processando", () => {
    expect(formatTaskStatus("running")).toBe("Processando");
  });
  it("translates success to Concluído", () => {
    expect(formatTaskStatus("success")).toBe("Concluído");
    expect(formatTaskStatus("done")).toBe("Concluído");
  });
  it("translates error/failure to Falhou", () => {
    expect(formatTaskStatus("error")).toBe("Falhou");
    expect(formatTaskStatus("failure")).toBe("Falhou");
  });
  it("returns unknown status as-is", () => {
    expect(formatTaskStatus("unknown_status")).toBe("unknown_status");
  });
  it("returns Aguardando for null/undefined", () => {
    expect(formatTaskStatus(null)).toBe("Aguardando");
    expect(formatTaskStatus(undefined)).toBe("Aguardando");
  });
});

describe("formatTaskStatusVariant", () => {
  it("returns default for success/done", () => {
    expect(formatTaskStatusVariant("success")).toBe("default");
    expect(formatTaskStatusVariant("done")).toBe("default");
  });
  it("returns destructive for error/failure", () => {
    expect(formatTaskStatusVariant("error")).toBe("destructive");
    expect(formatTaskStatusVariant("failure")).toBe("destructive");
  });
  it("returns secondary for pending", () => {
    expect(formatTaskStatusVariant("pending")).toBe("secondary");
  });
  it("returns outline for running", () => {
    expect(formatTaskStatusVariant("running")).toBe("outline");
  });
});

describe("formatBeatName", () => {
  it("translates all beat types", () => {
    expect(formatBeatName("hook")).toBe("Gancho inicial");
    expect(formatBeatName("setup")).toBe("Preparação");
    expect(formatBeatName("conflict")).toBe("Conflito");
    expect(formatBeatName("escalation")).toBe("Escalada");
    expect(formatBeatName("payoff")).toBe("Entrega");
    expect(formatBeatName("cta")).toBe("Chamada para ação");
  });
  it("returns unknown beat as-is", () => {
    expect(formatBeatName("unknown_beat")).toBe("unknown_beat");
  });
});

describe("formatTechnicalTerm", () => {
  it("translates known terms", () => {
    expect(formatTechnicalTerm("hook_strength")).toBe("Força do gancho inicial");
    expect(formatTechnicalTerm("curiosity_gaps")).toBe("Ganchos de curiosidade");
    expect(formatTechnicalTerm("timeline_analysis")).toBe("Linha do tempo da retenção");
    expect(formatTechnicalTerm("beat_scores")).toBe("Desempenho por parte do vídeo");
  });
  it("returns unknown term as-is", () => {
    expect(formatTechnicalTerm("some_unknown")).toBe("some_unknown");
  });
});

describe("formatAnalysisScore", () => {
  it("returns '-' for null/undefined", () => {
    expect(formatAnalysisScore(null)).toBe("-");
    expect(formatAnalysisScore(undefined)).toBe("-");
  });
  it("converts decimal (0-1) to percentage", () => {
    expect(formatAnalysisScore(0.87)).toBe("87%");
    expect(formatAnalysisScore(1)).toBe("100%");
  });
  it("formats scores > 1 as X/10", () => {
    expect(formatAnalysisScore(8.4)).toBe("8.4/10");
  });
});

describe("formatScriptStatus", () => {
  it("translates known statuses", () => {
    expect(formatScriptStatus("draft")).toBe("Rascunho");
    expect(formatScriptStatus("approved")).toBe("Aprovado");
    expect(formatScriptStatus("published")).toBe("Publicado");
    expect(formatScriptStatus("analyzed")).toBe("Analisado");
    expect(formatScriptStatus("archived")).toBe("Arquivado");
  });
  it("returns unknown status as-is", () => {
    expect(formatScriptStatus("custom_status")).toBe("custom_status");
  });
});
