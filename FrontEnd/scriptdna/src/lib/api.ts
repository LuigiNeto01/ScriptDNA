import type { ApiResponse, ApiError } from "@/types/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type AuthTokensPayload = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
};

type FastApiValidationError = {
  detail?: Array<{
    loc?: Array<string | number>;
    msg?: string;
  }>;
};

export class ApiClientError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function formatValidationError(payload: FastApiValidationError) {
  if (!Array.isArray(payload.detail) || payload.detail.length === 0) {
    return null;
  }

  return payload.detail
    .map((item) => {
      const field = item.loc?.filter((part) => part !== "body").join(".");
      return field ? `${field}: ${item.msg}` : item.msg;
    })
    .filter(Boolean)
    .join("; ");
}

async function parseErrorResponse(res: Response) {
  const payload = await res.json().catch(() => null);
  const apiError = payload as ApiError | null;
  const validationMessage = payload
    ? formatValidationError(payload as FastApiValidationError)
    : null;

  return new ApiClientError(
    res.status,
    apiError?.error?.code ?? (res.status === 422 ? "VALIDATION_ERROR" : "UNKNOWN"),
    apiError?.error?.message ?? validationMessage ?? res.statusText,
    apiError?.error?.details ?? payload
  );
}

class ApiClient {
  private baseUrl: string;
  private refreshPromise: Promise<boolean> | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getAuthHeaders(): Record<string, string> {
    if (typeof window === "undefined") return {};
    const token = localStorage.getItem("access_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private async request<T>(
    path: string,
    options?: RequestInit,
    retryOnUnauthorized = true
  ): Promise<ApiResponse<T>> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...this.getAuthHeaders(),
        ...options?.headers,
      },
      ...options,
    });

    if (res.status === 401 && retryOnUnauthorized && !path.startsWith("/api/auth/")) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        return this.request<T>(path, options, false);
      }
    }

    if (!res.ok) {
      throw await parseErrorResponse(res);
    }

    return res.json();
  }

  async get<T>(path: string): Promise<ApiResponse<T>> {
    return this.request<T>(path);
  }

  async post<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(path: string): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      method: "DELETE",
    });
  }

  async upload<T>(path: string, formData: FormData): Promise<ApiResponse<T>> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: formData,
    });

    if (res.status === 401) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        const retry = await fetch(`${this.baseUrl}${path}`, {
          method: "POST",
          headers: this.getAuthHeaders(),
          body: formData,
        });

        if (!retry.ok) {
          throw await parseErrorResponse(retry);
        }

        return retry.json();
      }
    }

    if (!res.ok) {
      throw await parseErrorResponse(res);
    }

    return res.json();
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (typeof window === "undefined") return false;

    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) return false;

    if (!this.refreshPromise) {
      this.refreshPromise = fetch(`${this.baseUrl}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      })
        .then(async (res) => {
          if (!res.ok) return false;

          const payload = (await res.json()) as ApiResponse<AuthTokensPayload>;
          localStorage.setItem("access_token", payload.data.access_token);
          localStorage.setItem("refresh_token", payload.data.refresh_token);
          return true;
        })
        .catch(() => false)
        .finally(() => {
          this.refreshPromise = null;
        });
    }

    const refreshed = await this.refreshPromise;
    if (!refreshed) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    }
    return refreshed;
  }
}

export const api = new ApiClient(API_BASE);
