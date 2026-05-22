/**
 * Minimal authenticated fetch wrapper.
 *
 * NOTE: We had openapi-fetch + a generated `paths` type but the OpenAPI
 * regen against the local FastAPI only captured 5 of the 30+ routes. Likely
 * fixable (re-run `npm run gen:api` once the backend exports all routers
 * in the OpenAPI spec correctly), but we're using plain fetch() in the
 * meantime so the customer-app team can polish the type-safety angle later
 * without blocking on it.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
