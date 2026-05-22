/**
 * /leads/[id] — single lead detail + notes thread.
 *
 * The backend doesn't expose GET /leads/{id} directly, so we read the
 * lead from the cached kanban response (already keyed in TanStack Query).
 * Notes come from GET /leads/{id}/notes. Add-note uses PATCH /leads/{id}
 * with `note`, which the server inserts as a LeadNote row in the same
 * transaction and bumps last_contact_at.
 */
"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useLeadNotes,
  useLeadsKanban,
  useUpdateLead,
  type Lead,
  type LeadStage,
} from "@/lib/queries";

const STAGE_LABELS: Record<LeadStage, string> = {
  new: "New",
  contacted: "Contacted",
  follow_up: "Follow up",
  won: "Won",
  lost: "Lost",
};
const STAGE_ORDER: LeadStage[] = [
  "new",
  "contacted",
  "follow_up",
  "won",
  "lost",
];

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

export default function LeadDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;

  const { data: kanban, isLoading: kanbanLoading } = useLeadsKanban();
  const { data: notes, isLoading: notesLoading } = useLeadNotes(id);
  const update = useUpdateLead();

  const [noteText, setNoteText] = useState("");

  let lead: Lead | undefined;
  for (const col of kanban?.columns ?? []) {
    const found = col.leads.find((l) => l.id === id);
    if (found) {
      lead = found;
      break;
    }
  }

  function addNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteText.trim()) return;
    update.mutate(
      { id, payload: { note: noteText.trim() } },
      {
        onSuccess: () => {
          toast.success("Note added");
          setNoteText("");
        },
        onError: (err) =>
          toast.error(
            `Save failed: ${(err as { message?: string })?.message ?? "unknown error"}`,
          ),
      },
    );
  }

  function changeStage(stage: LeadStage) {
    if (!lead || lead.stage === stage) return;
    update.mutate(
      { id, payload: { stage } },
      {
        onSuccess: () => toast.success(`Moved to ${STAGE_LABELS[stage]}`),
        onError: (err) =>
          toast.error(
            `Move failed: ${(err as { message?: string })?.message ?? "unknown error"}`,
          ),
      },
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-sm text-muted-foreground">
          <Link href="/leads" className="hover:underline">
            ← Leads
          </Link>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {lead ? (
            <code className="font-mono">{lead.application.reference_number}</code>
          ) : (
            "Lead"
          )}
        </h1>
      </div>

      {kanbanLoading && (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            Loading…
          </CardContent>
        </Card>
      )}

      {!kanbanLoading && !lead && (
        <Card>
          <CardContent className="py-6 text-sm text-destructive">
            Lead not found. It may have been deleted or belongs to another tenant.
          </CardContent>
        </Card>
      )}

      {lead && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Application</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-1 text-sm">
                <div>
                  <span className="text-muted-foreground">Reference: </span>
                  <Link
                    href={`/applications/${lead.application.id}`}
                    className="font-mono text-primary hover:underline"
                  >
                    {lead.application.reference_number}
                  </Link>
                </div>
                <div>
                  <span className="text-muted-foreground">Council: </span>
                  {lead.application.council?.name}
                </div>
                {lead.application.site_address && (
                  <div>
                    <span className="text-muted-foreground">Site: </span>
                    {lead.application.site_address}
                  </div>
                )}
                {lead.application.description && (
                  <div className="mt-2 text-muted-foreground">
                    {lead.application.description}
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Stage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-3 flex items-center gap-2">
                <Badge>{STAGE_LABELS[lead.stage]}</Badge>
                <span className="text-xs text-muted-foreground">
                  last contact {formatDateTime(lead.last_contact_at)}
                </span>
              </div>
              <Label className="mb-2 block text-xs">Move to</Label>
              <div className="flex flex-wrap gap-2">
                {STAGE_ORDER.map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant={s === lead!.stage ? "default" : "outline"}
                    onClick={() => changeStage(s)}
                    disabled={update.isPending || s === lead!.stage}
                  >
                    {STAGE_LABELS[s]}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">
                Notes ({lead.note_count})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={addNote} className="flex items-center gap-2">
                <Input
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Add a contact note — call, email, meeting…"
                  maxLength={2000}
                />
                <Button
                  type="submit"
                  disabled={update.isPending || !noteText.trim()}
                >
                  Add
                </Button>
              </form>

              {notesLoading && (
                <p className="text-sm text-muted-foreground">Loading notes…</p>
              )}
              {!notesLoading && (notes?.length ?? 0) === 0 && (
                <p className="text-sm text-muted-foreground">
                  No notes yet. Log your first contact above.
                </p>
              )}
              <ul className="space-y-3">
                {notes?.map((n) => (
                  <li
                    key={n.id}
                    className="rounded-md border bg-card p-3 text-sm"
                  >
                    <div className="mb-1 text-xs text-muted-foreground">
                      {formatDateTime(n.created_at)}
                    </div>
                    <div className="whitespace-pre-wrap">{n.note}</div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
