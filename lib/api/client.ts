/**
 * Type-safe API client wrapping openapi-fetch with the generated `paths` type.
 *
 * Two factory functions:
 *   - `createApiClient()`        — no auth (use for /auth/login etc.)
 *   - `createAuthedApiClient(t)` — adds `Authorization: Bearer <t>` to every request
 *
 * Regenerate `./types.ts` from the running FastAPI app with `npm run gen:api`.
 */
import createClient from "openapi-fetch";
import type { paths } from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function createApiClient() {
  return createClient<paths>({ baseUrl: BASE_URL });
}

export function createAuthedApiClient(accessToken: string) {
  return createClient<paths>({
    baseUrl: BASE_URL,
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export type ApiClient = ReturnType<typeof createApiClient>;
