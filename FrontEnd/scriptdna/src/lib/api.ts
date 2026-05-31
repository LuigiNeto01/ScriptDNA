import type { ApiResponse, ApiError } from "@/types/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

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

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    path: string,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    });

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
      body: formData,
    });

    if (!res.ok) {
      throw await parseErrorResponse(res);
    }

    return res.json();
  }
}

export const api = new ApiClient(API_BASE);
