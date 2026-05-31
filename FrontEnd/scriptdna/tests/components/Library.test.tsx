/**
 * Testes de componente — Library (/library)
 *
 * Cobre:
 * - Renderiza grid de vídeos
 * - Empty state quando lista vazia
 * - Campo de busca existe
 * - Filtro de niche existe
 */
import { describe, it, expect } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "../mocks/server";
import { renderWithProviders } from "../helpers";
import { mockVideo } from "../mocks/handlers";
import LibraryPage from "@/app/library/page";

describe("Library Page", () => {
  it("renders video cards when data is available", async () => {
    renderWithProviders(<LibraryPage />);

    await waitFor(() => {
      expect(screen.getByText(mockVideo.title)).toBeInTheDocument();
    });
  });

  it("shows empty state when no videos", async () => {
    server.use(
      http.get("http://localhost:8000/api/videos", () => {
        return HttpResponse.json({ data: [] });
      })
    );

    renderWithProviders(<LibraryPage />);

    await waitFor(() => {
      expect(
        screen.queryByText(/nenhum vídeo/i) ||
          screen.queryByText(/biblioteca vazia/i)
      ).toBeTruthy();
    });
  });

  it("has a search input", async () => {
    renderWithProviders(<LibraryPage />);

    await waitFor(() => {
      const search = screen.getByTestId("search-input");
      expect(search).toBeInTheDocument();
    });
  });

  it("has a niche filter", async () => {
    renderWithProviders(<LibraryPage />);

    await waitFor(() => {
      const filter = screen.getByTestId("niche-filter");
      expect(filter).toBeInTheDocument();
    });
  });

  it("displays video status badge", async () => {
    renderWithProviders(<LibraryPage />);

    await waitFor(() => {
      expect(
        screen.queryByText(/done/i) || screen.queryByTestId("status-badge")
      ).toBeTruthy();
    });
  });
});
