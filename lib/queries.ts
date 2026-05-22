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

// ── Single application (client-side) ───────────────────────────────────

export type ApplicationDetail = ApplicationRow & {
  proposal?: string | null;
  applicant_name?: string | null;
  applicant_address?: string | null;
  agent_name?: string | null;
  agent_company_name?: string | null;
  agent_address?: string | null;
  agent_email_address?: string | null;
  ward?: string | null;
  parish?: string | null;
  case_officer?: string | null;
};

export function useApplication(id: string | undefined) {
  const token = useToken();
  return useQuery({
    queryKey: ["application", id],
    queryFn: async () =>
      apiFetchAuthed<ApplicationDetail>(
        `/applications/${encodeURIComponent(id!)}`,
        token!,
      ),
    enabled: Boolean(token && id),
  });
}

// ── Saved searches ─────────────────────────────────────────────────────

export type SavedSearch = {
  id: string;
  user_id: string;
  name: string;
  filters: Record<string, unknown>;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export type SavedSearchCreatePayload = {
  name: string;
  filters: Record<string, unknown>;
  is_default?: boolean;
};

export function useSavedSearches() {
  const token = useToken();
  return useQuery({
    queryKey: ["saved_searches"],
    queryFn: async () => {
      const data = await apiFetchAuthed<SavedSearch[]>(
        "/saved_searches",
        token!
      );
      return data;
    },
    enabled: Boolean(token),
  });
}

export function useCreateSavedSearch() {
  const token = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: SavedSearchCreatePayload) =>
      apiFetchAuthed<SavedSearch>("/saved_searches", token!, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["saved_searches"] }),
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

// ── Letter templates ───────────────────────────────────────────────────
// The backend doesn't expose GET /letter-templates yet (templates are
// managed via the Jinja admin harness). We probe optimistically so the
// UI lights up automatically once an endpoint is added; until then the
// 404 surfaces a "templates unavailable" hint and a UUID-entry fallback.

export type LetterTemplate = {
  id: string;
  name: string;
  body?: string | null;
};

export function useLetterTemplates() {
  const token = useToken();
  return useQuery({
    queryKey: ["letter_templates"],
    queryFn: async () => {
      const data = await apiFetchAuthed<
        LetterTemplate[] | { items?: LetterTemplate[] }
      >("/letter-templates", token!);
      return Array.isArray(data) ? data : data.items ?? [];
    },
    enabled: Boolean(token),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

// ── Letters ────────────────────────────────────────────────────────────

export type LetterStatus =
  | "draft"
  | "printed"
  | "sent"
  | "delivered"
  | "bounced";

export type Letter = {
  id: string;
  application_id: string;
  template_id: string;
  user_id: string;
  status: LetterStatus;
  s3_pdf_key?: string | null;
  follow_up_date?: string | null;
  printed_at?: string | null;
  sent_at?: string | null;
  created_at: string;
};

export type LetterCreatePayload = {
  application_id: string;
  template_id: string;
  follow_up_date?: string;
};

export function useLetters() {
  const token = useToken();
  return useQuery({
    queryKey: ["letters"],
    queryFn: async () => apiFetchAuthed<Letter[]>("/letters", token!),
    enabled: Boolean(token),
  });
}

export function useCreateLetter() {
  const token = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: LetterCreatePayload) =>
      apiFetchAuthed<Letter>("/letters", token!, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["letters"] });
      // Creating a letter auto-creates a lead_tracking row, so the kanban
      // needs to refetch too.
      qc.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}

// ── Leads ──────────────────────────────────────────────────────────────

export type LeadStage = "new" | "contacted" | "follow_up" | "won" | "lost";

export type Lead = {
  id: string;
  user_id: string;
  application: ApplicationRow & {
    proposal?: string | null;
    applicant_name?: string | null;
    agent_name?: string | null;
    agent_email_address?: string | null;
  };
  stage: LeadStage;
  position: number;
  last_contact_at?: string | null;
  created_at: string;
  updated_at: string;
  note_count: number;
};

export type KanbanColumn = { stage: LeadStage; leads: Lead[] };
export type KanbanResponse = { columns: KanbanColumn[] };

export function useLeadsKanban() {
  const token = useToken();
  return useQuery({
    queryKey: ["leads", "kanban"],
    queryFn: async () =>
      apiFetchAuthed<KanbanResponse>("/leads/kanban", token!),
    enabled: Boolean(token),
  });
}

export type LeadUpdatePayload = {
  stage?: LeadStage;
  position?: number;
  last_contact_at?: string;
  note?: string;
};

export function useUpdateLead() {
  const token = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: LeadUpdatePayload;
    }) =>
      apiFetchAuthed<Lead>(`/leads/${id}`, token!, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["leads", "kanban"] });
      qc.invalidateQueries({ queryKey: ["lead", variables.id] });
      qc.invalidateQueries({ queryKey: ["lead_notes", variables.id] });
    },
  });
}

export type LeadNote = {
  id: string;
  user_id: string;
  note: string;
  created_at: string;
};

export function useLeadNotes(leadId: string | undefined) {
  const token = useToken();
  return useQuery({
    queryKey: ["lead_notes", leadId],
    queryFn: async () =>
      apiFetchAuthed<LeadNote[]>(`/leads/${leadId}/notes`, token!),
    enabled: Boolean(token && leadId),
  });
}

// ── Admin (platform_admin only) ────────────────────────────────────────

export type ScrapeFrequency = "hourly" | "every_4h" | "daily" | "weekly";
export type ScrapeStatus = "success" | "failed" | "in_progress" | "cancelled";

export type ScrapeSchedule = {
  id: string;
  tier: ScrapeFrequency;
  cron_expression: string;
  description?: string | null;
  enabled: boolean;
  last_applied_at?: string | null;
  last_applied_by?: string | null;
  created_at: string;
  updated_at: string;
};

export type TierHealth = {
  tier: ScrapeFrequency;
  enabled: boolean;
  cron_expression: string;
  expected_interval_minutes: number;
  stale_threshold_minutes: number;
  last_success_at?: string | null;
  last_attempt_at?: string | null;
  minutes_since_success?: number | null;
  is_stale: boolean;
};

export type HealthReport = {
  generated_at: string;
  tiers: TierHealth[];
  stale_count: number;
};

export function useScrapeSchedules() {
  const token = useToken();
  return useQuery({
    queryKey: ["admin", "scrape_schedules"],
    queryFn: async () =>
      apiFetchAuthed<ScrapeSchedule[]>("/admin/scrape-schedules", token!),
    enabled: Boolean(token),
    retry: false,
  });
}

export function useScrapeHealth() {
  const token = useToken();
  return useQuery({
    queryKey: ["admin", "scrape_health"],
    queryFn: async () =>
      apiFetchAuthed<HealthReport>("/admin/scrape-health", token!),
    enabled: Boolean(token),
    retry: false,
  });
}
