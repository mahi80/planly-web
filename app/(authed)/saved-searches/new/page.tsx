/**
 * /saved-searches/new — create a named filter preset.
 *
 * Same filter inputs as /search but no URL-pushing: on submit we POST the
 * filter object to /saved_searches and redirect to /saved-searches.
 */
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCouncils, useCreateSavedSearch } from "@/lib/queries";

const STATUSES = ["pending", "granted", "refused", "withdrawn"];

export default function NewSavedSearchPage() {
  const router = useRouter();
  const create = useCreateSavedSearch();
  const { data: councilsData, isLoading: councilsLoading } = useCouncils();

  const [name, setName] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [councilId, setCouncilId] = useState("");
  const [status, setStatus] = useState("");
  const [postcode, setPostcode] = useState("");
  const [q, setQ] = useState("");
  const [formerDistrict, setFormerDistrict] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const councils: { id: number; name: string }[] = Array.isArray(councilsData)
    ? (councilsData as { id: number; name: string }[])
    : [];

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name is required.");
      return;
    }
    const filters: Record<string, unknown> = {};
    if (councilId) filters.council_id = [Number(councilId)];
    if (status) filters.status = [status];
    if (postcode) filters.postcode = postcode;
    if (q) filters.q = q;
    if (formerDistrict) filters.former_district = formerDistrict;
    if (dateFrom) filters.received_date_from = dateFrom;
    if (dateTo) filters.received_date_to = dateTo;

    create.mutate(
      { name: name.trim(), filters, is_default: isDefault },
      {
        onSuccess: () => {
          toast.success(`Saved search "${name}" created`);
          router.push("/saved-searches");
        },
        onError: (e) =>
          toast.error(
            `Create failed: ${(e as { message?: string })?.message ?? "unknown error"}`,
          ),
      },
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-sm text-muted-foreground">
          <Link href="/saved-searches" className="hover:underline">
            ← Saved searches
          </Link>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">New saved search</h1>
      </div>

      <form onSubmit={submit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Identification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='e.g. "Granted single-storey extensions in BA"'
                maxLength={120}
                required
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              Make this my default search
            </label>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-4">
              <div>
                <Label htmlFor="council">Council</Label>
                <Select
                  value={councilId || "all"}
                  onValueChange={(v) => setCouncilId(v === "all" ? "" : v)}
                >
                  <SelectTrigger id="council">
                    <SelectValue
                      placeholder={councilsLoading ? "Loading…" : "All councils"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All councils</SelectItem>
                    {councils.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={status || "any"}
                  onValueChange={(v) => setStatus(v === "any" ? "" : v)}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Any status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any status</SelectItem>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="postcode">Postcode prefix</Label>
                <Input
                  id="postcode"
                  value={postcode}
                  onChange={(e) => setPostcode(e.target.value)}
                  placeholder="SW1, BA6…"
                />
              </div>

              <div>
                <Label htmlFor="former_district">Former district</Label>
                <Input
                  id="former_district"
                  value={formerDistrict}
                  onChange={(e) => setFormerDistrict(e.target.value)}
                  placeholder="Mendip, Allerdale…"
                />
              </div>

              <div>
                <Label htmlFor="from">Received from</Label>
                <Input
                  id="from"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="to">Received to</Label>
                <Input
                  id="to"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="q">Full-text search (description)</Label>
                <Input
                  id="q"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="single-storey extension, loft conversion…"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-4 flex items-center gap-2">
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? "Saving…" : "Save"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/saved-searches">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
