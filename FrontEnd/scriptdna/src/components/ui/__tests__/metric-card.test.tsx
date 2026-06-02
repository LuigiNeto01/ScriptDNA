import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MetricCard } from "../metric-card";

// Mock simples do ícone
const TestIcon = () => <svg data-testid="test-icon" />;

describe("MetricCard", () => {
  it("renders title and value", () => {
    render(<MetricCard title="Views Médias" value="12.4K" />);
    expect(screen.getByText("Views Médias")).toBeDefined();
    expect(screen.getByText("12.4K")).toBeDefined();
  });

  it("renders description when provided", () => {
    render(
      <MetricCard title="Roteiros" value={5} description="Roteiros versionados" />
    );
    expect(screen.getByText("Roteiros versionados")).toBeDefined();
  });

  it("renders icon when provided", () => {
    render(<MetricCard title="Test" value={0} icon={TestIcon} />);
    expect(screen.getByTestId("test-icon")).toBeDefined();
  });

  it("renders loading spinner when loading=true", () => {
    render(<MetricCard title="Test" value={0} loading />);
    expect(screen.getByText("Carregando...")).toBeDefined();
  });

  it("renders trend with positive value", () => {
    render(<MetricCard title="Test" value={10} trend={{ value: 15, label: "vs mês anterior" }} />);
    expect(screen.getByText(/\+15%/)).toBeDefined();
  });

  it("renders trend with negative value", () => {
    render(<MetricCard title="Test" value={10} trend={{ value: -8 }} />);
    expect(screen.getByText(/-8%/)).toBeDefined();
  });

  it("accepts numeric value", () => {
    render(<MetricCard title="Insights" value={42} />);
    expect(screen.getByText("42")).toBeDefined();
  });
});
