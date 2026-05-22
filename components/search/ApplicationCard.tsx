/**
 * Single result card on the search page. Click navigates to the detail page.
 */
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Status = "pending" | "granted" | "refused" | "withdrawn" | null | undefined;

function statusVariant(s: Status): "default" | "secondary" | "destructive" | "outline" {
  switch (s) {
    case "granted":
      return "default";
    case "refused":
    case "withdrawn":
      return "destructive";
    case "pending":
      return "secondary";
    default:
      return "outline";
  }
}

type Confidence = "high" | "medium" | "low" | null | undefined;

function confidenceColor(c: Confidence): string {
  switch (c) {
    case "high":
      return "bg-green-500";
    case "medium":
      return "bg-amber-500";
    case "low":
      return "bg-gray-400";
    default:
      return "bg-transparent";
  }
}

export type ApplicationCardProps = {
  id: string;
  reference_number: string;
  council: { id: number; name: string };
  site_address?: string | null;
  description?: string | null;
  status_canonical?: Status;
  status_raw?: string | null;
  received_date?: string | null;
  application_type?: string | null;
  former_district?: string | null;
  former_district_confidence?: Confidence;
};

export function ApplicationCard(app: ApplicationCardProps) {
  return (
    <Link href={`/applications/${app.id}`} className="block">
      <Card className="transition-colors hover:bg-accent/30">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <CardTitle className="text-base font-semibold">
              <span className="text-muted-foreground">{app.council.name}</span>
              <span className="mx-2 text-muted-foreground">·</span>
              <code className="text-sm font-mono">{app.reference_number}</code>
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              {app.former_district && (
                <Badge variant="outline" className="gap-1">
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${confidenceColor(
                      app.former_district_confidence
                    )}`}
                    title={`${app.former_district_confidence} confidence`}
                  />
                  {app.former_district}
                </Badge>
              )}
              {app.status_canonical && (
                <Badge variant={statusVariant(app.status_canonical)}>
                  {app.status_canonical}
                </Badge>
              )}
              {!app.status_canonical && app.status_raw && (
                <Badge variant="outline">{app.status_raw}</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-1 pt-0 text-sm">
          {app.site_address && (
            <div className="text-foreground">{app.site_address}</div>
          )}
          {app.description && (
            <div className="line-clamp-2 text-muted-foreground">{app.description}</div>
          )}
          <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
            {app.application_type && <span>{app.application_type}</span>}
            {app.received_date && <span>Received {app.received_date}</span>}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
