/**
 * /letters/new — draft a letter for an application.
 *
 * Requires `?application_id=<uuid>` query param. We fetch the application
 * so the preview shows reference + addressee context; the user picks a
 * template (Select if /letter-templates is wired, UUID input otherwise)
 * and optionally a follow-up date. POST /letters creates the letter +
 * the matching lead_tracking row on the server.
 */
"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";

import { TemplateSelect } from "@/components/letters/TemplateSelect";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApplication, useCreateLetter } from "@/lib/queries";

function NewLetterInner() {
  const router = useRouter();
  const params = useSearchParams();
  const applicationId = params.get("application_id") ?? "";

  const { data: app, isLoading: appLoading, isError: appError } =
    useApplication(applicationId || undefined);
  const create = useCreateLetter();

  const [templateId, setTemplateId] = useState("");
  const [followUp, setFollowUp] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!applicationId) {
      toast.error("application_id is missing from the URL.");
      return;
    }
    if (!templateId.trim()) {
      toast.error("Pick a template before saving.");
      return;
    }

    create.mutate(
      {
        application_id: applicationId,
        template_id: templateId.trim(),
        follow_up_date: followUp || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Draft letter created");
          router.push("/letters");
        },
        onError: (e) => {
          const detail = (e as { detail?: { detail?: unknown } })?.detail
            ?.detail;
          toast.error(
            `Create failed: ${
              typeof detail === "string"
                ? detail
                : (e as { message?: string })?.message ?? "unknown error"
            }`,
          );
        },
      },
    );
  }

  const recipient = app
    ? app.agent_name || app.applicant_name || "—"
    : "—";
  const recipientAddress = app
    ? app.agent_address || app.applicant_address || ""
    : "";

  return (
    <div className="space-y-4">
      <div>
        <div className="text-sm text-muted-foreground">
          <Link href="/letters" className="hover:underline">
            ← Letters
          </Link>
          {applicationId && (
            <>
              {" · "}
              <Link
                href={`/applications/${applicationId}`}
                className="hover:underline"
              >
                Back to application
              </Link>
            </>
          )}
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Draft letter</h1>
      </div>

      {!applicationId && (
        <Card>
          <CardContent className="py-6 text-sm text-destructive">
            No application selected. Open an application and click &quot;Draft
            letter&quot; to start.
          </CardContent>
        </Card>
      )}

      {applicationId && (
        <form onSubmit={submit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Application</CardTitle>
            </CardHeader>
            <CardContent>
              {appLoading && (
                <p className="text-sm text-muted-foreground">Loading…</p>
              )}
              {appError && (
                <p className="text-sm text-destructive">
                  Couldn&apos;t load application. The ID may be invalid.
                </p>
              )}
              {app && (
                <dl className="space-y-1 text-sm">
                  <div>
                    <span className="text-muted-foreground">Reference: </span>
                    <code className="font-mono">{app.reference_number}</code>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Council: </span>
                    {app.council?.name}
                  </div>
                  {app.site_address && (
                    <div>
                      <span className="text-muted-foreground">Site: </span>
                      {app.site_address}
                    </div>
                  )}
                  {app.description && (
                    <div className="mt-2 text-muted-foreground">
                      {app.description}
                    </div>
                  )}
                </dl>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recipient</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-1 text-sm">
                <div>
                  <span className="text-muted-foreground">Name: </span>
                  {recipient}
                </div>
                {recipientAddress && (
                  <div>
                    <span className="text-muted-foreground">Address: </span>
                    {recipientAddress}
                  </div>
                )}
                {app?.agent_email_address && (
                  <div>
                    <span className="text-muted-foreground">Agent email: </span>
                    {app.agent_email_address}
                  </div>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  Recipient details are pulled from the application. They&apos;ll
                  be merged into the template when the PDF renders.
                </p>
              </dl>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Template + follow-up</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <TemplateSelect value={templateId} onChange={setTemplateId} />
              <div>
                <Label htmlFor="follow_up">Follow-up date (optional)</Label>
                <Input
                  id="follow_up"
                  type="date"
                  value={followUp}
                  onChange={(e) => setFollowUp(e.target.value)}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  When you want a reminder to chase this lead. Surfaces on the
                  kanban card.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="md:col-span-2 flex items-center gap-2">
            <Button type="submit" disabled={create.isPending || !templateId}>
              {create.isPending ? "Saving…" : "Create draft"}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link
                href={`/applications/${applicationId}`}
              >
                Cancel
              </Link>
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function NewLetterPage() {
  return (
    <Suspense fallback={<div className="text-sm text-muted-foreground">Loading…</div>}>
      <NewLetterInner />
    </Suspense>
  );
}
