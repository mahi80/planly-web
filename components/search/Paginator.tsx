/**
 * Lightweight pagination — Prev / page X of Y / Next.
 * Operates on the URL search params so back/forward + share-link work.
 */
"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";

export type PaginatorProps = {
  total: number;
  skip: number;
  limit: number;
};

export function Paginator({ total, skip, limit }: PaginatorProps) {
  const router = useRouter();
  const params = useSearchParams();

  const page = Math.floor(skip / limit) + 1;
  const pages = Math.max(1, Math.ceil(total / limit));

  function goto(newSkip: number) {
    const p = new URLSearchParams(params.toString());
    p.set("skip", String(Math.max(0, newSkip)));
    p.set("limit", String(limit));
    router.push(`?${p.toString()}`);
  }

  return (
    <div className="flex items-center justify-between gap-3 py-2 text-sm">
      <div className="text-muted-foreground">
        {total === 0
          ? "No results"
          : `Showing ${skip + 1}–${Math.min(skip + limit, total)} of ${total}`}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => goto(skip - limit)}
        >
          Prev
        </Button>
        <span className="text-muted-foreground">
          Page {page} of {pages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= pages}
          onClick={() => goto(skip + limit)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
