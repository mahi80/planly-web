/**
 * API client — two layers:
 *
 * 1. `apiClient` — typed openapi-fetch client built from the generated
 *    `paths` interface in `./types`. Use `apiClient.GET(...)` etc. for
 *    full request/response type-safety on all 21 API routes.
 *
 * 2. `apiFetchAuthed` / `apiFetch` — plain fetch wrappers used by the
 *    existing TanStack Query hooks. These are kept for backward-compat;
 *    new hooks should prefer `apiClient`.
 *
 * Types regenerated via `npm run gen:api` (openapi-typescript v7 against
 * the FastAPI app at api.main:app — 21 routes as of 2026-05-22).
 */
import createClient from "openapi-fetch";
import type { paths } from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Typed openapi-fetch client. Request/response bodies are fully typed via
 * the generated `paths` interface. Prefer this over `apiFetchAuthed` for
 * new hooks; set the `Authorization` header per-call:
 *
 *   const { data, error } = await apiClient.GET("/councils", {
 *     headers: { Authorization: `Bearer ${token}` },
 *   });
 */
export const apiClient = createClient<paths>({ baseUrl: BASE_URL });

export type ApiError = {
  status: number;
  message: string;
  detail?: unknown;
};

async function request<T>(
  path: string,
  init: RequestInit = {},
  token?: string
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers });

  if (!res.ok) {
    let detail: unknown = undefined;
    try {
      detail = await res.json();
    } catch {
      // ignore JSON parse error on error responses
    }
    const err: ApiError = {
      status: res.status,
      message: `HTTP ${res.status} on ${path}`,
      detail,
    };
    throw err;
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export function apiFetch<T = unknown>(path: string, init: RequestInit = {}) {
  return request<T>(path, init);
}

export function apiFetchAuthed<T = unknown>(
  path: string,
  token: string,
  init: RequestInit = {}
) {
  return request<T>(path, init, token);
}
