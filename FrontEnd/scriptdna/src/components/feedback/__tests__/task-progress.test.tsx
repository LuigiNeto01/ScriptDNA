import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TaskProgress } from "../task-progress";

describe("TaskProgress", () => {
  it("renders nothing when status is null", () => {
    const { container } = render(<TaskProgress status={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders 'Em fila' for pending status", () => {
    render(<TaskProgress status="pending" />);
    expect(screen.getAllByText("Em fila").length).toBeGreaterThan(0);
  });

  it("renders 'Processando' for running status", () => {
    render(<TaskProgress status="running" />);
    expect(screen.getAllByText("Processando").length).toBeGreaterThan(0);
  });

  it("renders 'Concluído' for success status", () => {
    render(<TaskProgress status="success" />);
    expect(screen.getAllByText("Concluído").length).toBeGreaterThan(0);
  });

  it("renders 'Falhou' for error status", () => {
    render(<TaskProgress status="error" />);
    expect(screen.getAllByText("Falhou").length).toBeGreaterThan(0);
  });

  it("renders error message when provided", () => {
    render(<TaskProgress status="error" error="Conexão recusada" />);
    expect(screen.getByText("Conexão recusada")).toBeDefined();
  });

  it("renders message for running tasks", () => {
    render(<TaskProgress status="running" message="Analisando 45 frames..." />);
    expect(screen.getByText("Analisando 45 frames...")).toBeDefined();
  });

  it("renders in compact mode", () => {
    const { container } = render(<TaskProgress status="pending" compact />);
    // In compact mode, no Badge is rendered (Badge is only in full mode)
    const badges = container.querySelectorAll("[class*='badge']");
    expect(badges.length).toBe(0);
  });
});
