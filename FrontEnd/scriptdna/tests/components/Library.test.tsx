import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "../mocks/server";
import { renderWithProviders } from "../helpers";
import { mockVideo } from "../mocks/handlers";
import LibraryPage from "@/app/library/page";

describe("Library Page", () => {
  it("renders reference cards when data is available", async () => {
    renderWithProviders(<LibraryPage />);

    await waitFor(() => {
      expect(screen.getByText(mockVideo.title)).toBeInTheDocument();
    });
  });

  it("shows educational empty state when no references exist", async () => {
    server.use(
      http.get("http://localhost:8000/api/videos", () => {
        return HttpResponse.json({ data: [] });
      })
    );

    renderWithProviders(<LibraryPage />);

    await waitFor(() => {
      expect(screen.getByText(/voce ainda nao adicionou referencias/i)).toBeInTheDocument();
    });
  });

  it("has a search input", async () => {
    renderWithProviders(<LibraryPage />);

    await waitFor(() => {
      expect(screen.getByTestId("search-input")).toBeInTheDocument();
    });
  });

  it("has a niche filter", async () => {
    renderWithProviders(<LibraryPage />);

    await waitFor(() => {
      expect(screen.getByTestId("niche-filter")).toBeInTheDocument();
    });
  });

  it("displays video status badge", async () => {
    renderWithProviders(<LibraryPage />);

    await waitFor(() => {
      expect(screen.queryByTestId("status-badge")).toBeTruthy();
    });
  });
});
