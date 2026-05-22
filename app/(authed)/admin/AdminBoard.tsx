/**
 * Admin board — read-only view of scrape schedules + tier health.
 *
 * Mutations (edit cron, deactivate a tier, reassign a council) still live
 * in the Jinja admin harness at /admin/ui on the backend. The customer
 * UI mirrors the data so on-call can sanity-check without leaving the app.
 */
"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useScrapeHealth,
  useScrapeSchedules,
  type TierHealth,
} from "@/lib/queries";

function formatDateTime(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function HealthRow({ row }: { row: TierHealth }) {
  return (
    <TableRow>
      <TableCell className="font-medium">{row.tier}</TableCell>
      <TableCell>
        {!row.enabled ? (
          <Badge variant="outline">disabled</Badge>
        ) : row.is_stale ? (
          <Badge variant="destructive">stale</Badge>
        ) : (
          <Badge>healthy</Badge>
        )}
      </TableCell>
      <TableCell className="font-mono text-xs">{row.cron_expression}</TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {formatDateTime(row.last_success_at)}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {row.minutes_since_success !== null && row.minutes_since_success !== undefined
          ? `${row.minutes_since_success.toFixed(1)} min ago`
          : "—"}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {row.stale_threshold_minutes} min
      </TableCell>
    </TableRow>
  );
}

export function AdminBoard() {
  const health = useScrapeHealth();
  const schedules = useScrapeSchedules();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Scrape tier health</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {health.isLoading && (
            <p className="px-6 py-4 text-sm text-muted-foreground">Loading…</p>
          )}
          {health.isError && (
            <p className="px-6 py-4 text-sm text-destructive">
              Failed to load health:{" "}
              {(health.error as Error)?.message ?? "unknown error"}
            </p>
          )}
          {health.data && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cron</TableHead>
                  <TableHead>Last success</TableHead>
                  <TableHead>Since success</TableHead>
                  <TableHead>Stale threshold</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {health.data.tiers.map((t) => (
                  <HealthRow key={t.tier} row={t} />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Scrape schedules</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {schedules.isLoading && (
            <p className="px-6 py-4 text-sm text-muted-foreground">Loading…</p>
          )}
          {schedules.isError && (
            <p className="px-6 py-4 text-sm text-destructive">
              Failed to load schedules:{" "}
              {(schedules.error as Error)?.message ?? "unknown error"}
            </p>
          )}
          {schedules.data && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tier</TableHead>
                  <TableHead>Cron</TableHead>
                  <TableHead>Enabled</TableHead>
                  <TableHead>Last applied</TableHead>
                  <TableHead>By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.data.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.tier}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {s.cron_expression}
                    </TableCell>
                    <TableCell>
                      {s.enabled ? (
                        <Badge>on</Badge>
                      ) : (
                        <Badge variant="outline">off</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateTime(s.last_applied_at)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {s.last_applied_by ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Read-only view. Edit schedules from the Jinja admin harness on the
        backend, then run{" "}
        <code className="rounded bg-muted px-1 py-0.5 font-mono">
          python scripts/install_cron.py
        </code>{" "}
        to apply.
      </p>
    </div>
  );
}
