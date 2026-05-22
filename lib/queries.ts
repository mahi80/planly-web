/**
 * TanStack Query hooks — server-state for the customer pages.
 *
 * Auth-aware via useSession(); the JWT travels as a Bearer header on every
 * request. Queries auto-refetch when filters or IDs change.
 */
"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useSession } from "next-auth/react";

import { apiFetchAuthed } from "@/lib/api/client";

function useToken(): string | undefined {
  const { data: session } = useSession();
  // @ts-expect-error -- session augmented with accessToken in auth.ts
  return session?.accessToken as string | undefined;
}

// ── Councils ───────────────────────────────────────────────────────────

type CouncilRef = { id: number; name: string };

export function useCouncils() {
  const token = useToken();
  return useQuery({
    queryKey: ["councils"],
    queryFn: async () => {
      // The /councils endpoint returns a paginated response. We surface
      // .items so the filter dropdown can map over them.
      const data = await apiFetchAuthed<
        { items?: CouncilRef[] } | CouncilRef[]
      >("/councils", token!);
      const items: CouncilRef[] = Array.isArray(data)
        ? data
        : data.items ?? [];
      return items;
    },
    enabled: Boolean(token),
    staleTime: 10 * 60 * 1000,
  });
}

// ── Applications search ────────────────────────────────────────────────

export type SearchFilters = {
  council_id?: number[];
  status?: string[];
  received_date_from?: string;
  received_date_to?: string;
  postcode?: string;
  q?: string;
  former_district?: string;
  skip?: number;
  limit?: number;
};

export type ApplicationRow = {
  id: string;
  council: { id: number; name: string };
  reference_number: string;
  site_address?: string | null;
  description?: string | null;
  status_canonical?: "pending" | "granted" | "refused" | "withdrawn" | null;
  status_raw?: string | null;
  received_date?: string | null;
  decision_date?: string | null;
  applicant_postcode?: string | null;
  application_type?: string | null;
  detail_url?: string | null;
  former_district?: string | null;
  former_district_confidence?: "high" | "medium" | "low" | null;
};

export type SearchResults = {
  items: ApplicationRow[];
  total: number;
  skip: number;
  limit: number;
};

function buildSearchQuery(f: SearchFilters): string {
  const p = new URLSearchParams();
  for (const id of f.council_id ?? []) p.append("council_id", String(id));
  for (const s of f.status ?? []) p.append("status", s);
  if (f.received_date_from) p.set("received_date_from", f.received_date_from);
  if (f.received_date_to) p.set("received_date_to", f.received_date_to);
  if (f.postcode) p.set("postcode", f.postcode);
  if (f.q) p.set("q", f.q);
  if (f.former_district) p.set("former_district", f.former_district);
  if (f.skip !== undefined) p.set("skip", String(f.skip));
  if (f.limit !== undefined) p.set("limit", String(f.limit));
  return p.toString();
}

export function useSearchApplications(filters: SearchFilters) {
  const token = useToken();
  return useQuery({
    queryKey: ["applications", "search", filters],
    queryFn: async () => {
      const qs = buildSearchQuery(filters);
      return apiFetchAuthed<SearchResults>(
        `/applications/search${qs ? `?${qs}` : ""}`,
        token!
      );
    },
    enabled: Boolean(token),
    placeholderData: (prev) => prev,
  });
}

// ── Saved searches ─────────────────────────────────────────────────────

export type SavedSearch = {
  id: string;
  name: string;
  filters: Record<string, unknown>;
  notify_on_new_match: boolean;
  created_at: string;
};

export function useSavedSearches() {
  const token = useToken();
  return useQuery({
    queryKey: ["saved_searches"],
    queryFn: async () => {
      const data = await apiFetchAuthed<
        { items?: SavedSearch[] } | SavedSearch[]
      >("/saved_searches/", token!);
      return Array.isArray(data) ? data : data.items ?? [];
    },
    enabled: Boolean(token),
  });
}

export function useDeleteSavedSearch() {
  const token = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) =>
      apiFetchAuthed(`/saved_searches/${id}`, token!, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["saved_searches"] }),
  });
}

// ── Leads ──────────────────────────────────────────────────────────────

export function useLeadsKanban() {
  const token = useToken();
  return useQuery({
    queryKey: ["leads", "kanban"],
    queryFn: async () => apiFetchAuthed("/leads/kanban", token!),
    enabled: Boolean(token),
  });
}
