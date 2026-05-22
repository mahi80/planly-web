/**
 * /search — full implementation.
 *
 * Filters live in URL search params (managed by SearchFilters component).
 * Results paginate via skip/limit also in URL. TanStack Query caches per-filter.
 */
"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { ApplicationCard } from "@/components/search/ApplicationCard";
import { Paginator } from "@/components/search/Paginator";
import { SearchFilters } from "@/components/search/SearchFilters";
import { Card, CardContent } from "@/components/ui/card";
import { useSearchApplications, type SearchFilters as SF } from "@/lib/queries";

function SearchInner() {
  const params = useSearchParams();

  const skip = Number(params.get("skip") || "0");
  const limit = Number(params.get("limit") || "20");

  const filters: SF = {
    skip,
    limit,
    council_id: params.get("council_id") ? [Number(params.get("council_id"))] : undefined,
    status: params.get("status") ? [params.get("status") as string] : undefined,
    postcode: params.get("postcode") || undefined,
    q: params.get("q") || undefined,
    former_district: params.get("former_district") || undefined,
    received_date_from: params.get("received_date_from") || undefined,
    received_date_to: params.get("received_date_to") || undefined,
  };

  const { data, isLoading, isError, error } = useSearchApplications(filters);

  // The backend response is shaped { items: [...], total, skip, limit }.
  const items = (data as { items?: unknown[] })?.items ?? [];
  const total = (data as { total?: number })?.total ?? 0;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Search planning applications</h1>

      <SearchFilters />

      {isError && (
        <Card>
          <CardContent className="py-6 text-sm text-destructive">
            Failed to load results: {(error as Error)?.message || "unknown error"}
          </CardContent>
        </Card>
      )}

      {isLoading && !data && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="py-6 text-sm text-muted-foreground">
                Loading…
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && items.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No results match these filters. Try widening the date range, clearing the
            council filter, or removing the full-text search.
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {items.map((row: unknown) => {
          const r = row as Parameters<typeof ApplicationCard>[0];
          return <ApplicationCard key={r.id} {...r} />;
        })}
      </div>

      {total > 0 && <Paginator total={total} skip={skip} limit={limit} />}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="text-sm text-muted-foreground">Loading…</div>}>
      <SearchInner />
    </Suspense>
  );
}
