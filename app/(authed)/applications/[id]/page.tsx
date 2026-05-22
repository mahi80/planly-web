/**
 * /applications/[id] — full detail page.
 *
 * Server component — fetches once from the API with the user's session
 * token. Renders the 30+ canonical fields organised into clear sections.
 */
import Link from "next/link";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetchAuthed } from "@/lib/api/client";

type Params = { id: string };

function field(label: string, value: unknown): React.ReactNode {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="grid grid-cols-[140px_1fr] gap-2 py-1 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-foreground">{String(value)}</dd>
    </div>
  );
}

export default async function ApplicationDetailPage({
  params,
}: {
  params: Params;
}) {
  const session = await auth();
  // @ts-expect-error -- session augmented with accessToken in auth.ts
  const token = session?.accessToken as string | undefined;
  if (!token) {
    notFound();
  }

  let data: Record<string, unknown> | null = null;
  try {
    data = await apiFetchAuthed<Record<string, unknown>>(
      `/applications/${encodeURIComponent(params.id)}`,
      token!
    );
  } catch {
    notFound();
  }
  if (!data) notFound();

  const a = data;
  const council = a.council as { id?: number; name?: string } | undefined;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-muted-foreground">
            <Link href="/search" className="hover:underline">
              ← Search
            </Link>{" "}
            · {council?.name}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            <code className="font-mono">{a.reference_number as string}</code>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {(a.former_district as string) && (
            <Badge variant="outline">
              Former district: {a.former_district as string}
              {(a.former_district_confidence as string) && (
                <span className="ml-1 text-xs text-muted-foreground">
                  ({a.former_district_confidence as string})
                </span>
              )}
            </Badge>
          )}
          {(a.status_canonical as string) && (
            <Badge>{a.status_canonical as string}</Badge>
          )}
          <Button asChild>
            <Link href={`/letters/new?application_id=${a.id as string}`}>
              Draft letter
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Location</CardTitle>
          </CardHeader>
          <CardContent>
            <dl>
              {field("Address", a.site_address)}
              {field("Postcode", a.applicant_postcode)}
              {field("Ward", a.ward)}
              {field("Parish", a.parish)}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <dl>
              {field("Description", a.description)}
              {field("Proposal", a.proposal)}
              {field("Application type", a.application_type)}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Applicant</CardTitle>
          </CardHeader>
          <CardContent>
            <dl>
              {field("Name", a.applicant_name)}
              {field("Address", a.applicant_address)}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Agent</CardTitle>
          </CardHeader>
          <CardContent>
            <dl>
              {field("Name", a.agent_name)}
              {field("Company", a.agent_company_name)}
              {field("Address", a.agent_address)}
              {field("Email", a.agent_email_address)}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <dl>
              {field("Canonical", a.status_canonical)}
              {field("Raw", a.status_raw)}
              {field("Decision level", a.actual_decision_level)}
              {field("Appeal", a.appeal_status)}
              {field("Case officer", a.case_officer)}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dates</CardTitle>
          </CardHeader>
          <CardContent>
            <dl>
              {field("Received", a.received_date)}
              {field("Validated", a.validated_date)}
              {field("Decision made", a.decision_made_date)}
              {field("Decision issued", a.decision_issued_date)}
              {field("Updated", a.updated_date)}
              {field("Expiry", a.expiry_date)}
            </dl>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Classification + provenance</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="md:grid md:grid-cols-2 md:gap-x-6">
              {field("EIA requested", a.environmental_assessment_requested)}
              {field("TPO", a.is_tpo)}
              {field("Data source", a.data_source)}
              {field("Pending KYC enrich", a.pending_kyc_enrichment)}
              {field("Created at", a.created_at)}
              {field("Updated at", a.updated_at)}
            </dl>
            {(a.detail_url as string) && (
              <div className="mt-2 text-sm">
                <a
                  href={a.detail_url as string}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Open on council portal ↗
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
