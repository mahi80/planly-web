/**
 * /letters — list the user's draft + sent letters, newest first.
 *
 * Backend returns LetterOut rows (no joined application or template
 * name yet). Rows link to the application detail; once /letter-templates
 * is wired we can also show the template name.
 */
"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLetters, type LetterStatus } from "@/lib/queries";

const STATUS_VARIANT: Record<
  LetterStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  draft: "secondary",
  printed: "outline",
  sent: "default",
  delivered: "default",
  bounced: "destructive",
};

function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function LettersPage() {
  const { data, isLoading, isError, error } = useLetters();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Letters</h1>
          <p className="text-sm text-muted-foreground">
            Drafts auto-create a lead — find them in your kanban under{" "}
            <Link href="/leads" className="text-primary hover:underline">
              Leads
            </Link>
            .
          </p>
        </div>
      </div>

      {isError && (
        <Card>
          <CardContent className="py-6 text-sm text-destructive">
            Failed to load letters: {(error as Error)?.message ?? "unknown error"}
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            Loading…
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && (data?.length ?? 0) === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No letters yet. Open an application and click &quot;Draft
            letter&quot; to start one.
            <div className="mt-4">
              <Button asChild>
                <Link href="/search">Find an application</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!isLoading && (data?.length ?? 0) > 0 && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Application</TableHead>
                  <TableHead>Follow-up</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data!.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[l.status]}>
                        {l.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      <Link
                        href={`/applications/${l.application_id}`}
                        className="text-primary hover:underline"
                      >
                        {l.application_id.slice(0, 8)}…
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(l.follow_up_date)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(l.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/applications/${l.application_id}`}>
                          View
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
