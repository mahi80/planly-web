/**
 * /saved-searches — list the user's saved search presets.
 *
 * Each row has a Run action (navigates to /search with the saved filters
 * applied) and a Delete action (confirmation dialog → DELETE). A header
 * CTA links to /saved-searches/new.
 *
 * Backend orders defaults first then alphabetic — we render in that order.
 */
"use client";

import { Star, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useDeleteSavedSearch,
  useSavedSearches,
  type SavedSearch,
} from "@/lib/queries";

function filtersToQueryString(filters: Record<string, unknown>): string {
  const p = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value === null || value === undefined || value === "") continue;
    if (Array.isArray(value)) {
      for (const v of value) p.append(key, String(v));
    } else {
      p.set(key, String(value));
    }
  }
  p.set("skip", "0");
  if (!p.has("limit")) p.set("limit", "20");
  return p.toString();
}

function filterSummary(filters: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(filters)) {
    if (value === null || value === undefined || value === "") continue;
    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      parts.push(`${key}: ${value.join(", ")}`);
    } else {
      parts.push(`${key}: ${String(value)}`);
    }
  }
  return parts.length ? parts.join(" · ") : "no filters";
}

export default function SavedSearchesPage() {
  const router = useRouter();
  const { data, isLoading, isError, error } = useSavedSearches();
  const del = useDeleteSavedSearch();

  const [pendingDelete, setPendingDelete] = useState<SavedSearch | null>(null);

  function runSaved(s: SavedSearch) {
    const qs = filtersToQueryString(s.filters);
    router.push(`/search?${qs}`);
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    del.mutate(pendingDelete.id, {
      onSuccess: () => {
        toast.success(`Deleted "${pendingDelete.name}"`);
        setPendingDelete(null);
      },
      onError: (e) => {
        toast.error(
          `Delete failed: ${(e as { message?: string })?.message ?? "unknown error"}`,
        );
      },
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Saved searches</h1>
          <p className="text-sm text-muted-foreground">
            Named filter presets. Run one to re-apply its filters on /search.
          </p>
        </div>
        <Button asChild>
          <Link href="/saved-searches/new">New saved search</Link>
        </Button>
      </div>

      {isError && (
        <Card>
          <CardContent className="py-6 text-sm text-destructive">
            Failed to load saved searches: {(error as Error)?.message ?? "unknown error"}
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">Loading…</CardContent>
        </Card>
      )}

      {!isLoading && !isError && (data?.length ?? 0) === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            You haven&apos;t saved any searches yet. Create one to re-run a filter
            set with one click.
          </CardContent>
        </Card>
      )}

      {!isLoading && (data?.length ?? 0) > 0 && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Filters</TableHead>
                  <TableHead className="w-[160px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data!.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {s.is_default && (
                          <Badge variant="secondary" className="gap-1">
                            <Star className="h-3 w-3" /> default
                          </Badge>
                        )}
                        {s.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <code className="break-all font-mono text-xs">
                        {filterSummary(s.filters)}
                      </code>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="default" onClick={() => runSaved(s)}>
                          Run
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setPendingDelete(s)}
                          aria-label="Delete saved search"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete saved search?</DialogTitle>
            <DialogDescription>
              This will remove &quot;{pendingDelete?.name}&quot; permanently. The
              underlying applications are unaffected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={del.isPending}
            >
              {del.isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
