/**
 * Search filter bar — pushes filter state into URL search params on submit
 * so back/forward navigation and shareable links work.
 *
 * Single-council picker for now; multi-select is a Session 3+ polish.
 */
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCouncils } from "@/lib/queries";

const STATUSES = ["pending", "granted", "refused", "withdrawn"];

export function SearchFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const { data: councilsData, isLoading: councilsLoading } = useCouncils();

  // Local form state — synced from URL on mount and whenever the URL changes.
  const [council_id, setCouncilId] = useState(params.get("council_id") || "");
  const [status, setStatus] = useState(params.get("status") || "");
  const [postcode, setPostcode] = useState(params.get("postcode") || "");
  const [q, setQ] = useState(params.get("q") || "");
  const [former_district, setFormerDistrict] = useState(
    params.get("former_district") || ""
  );
  const [dateFrom, setDateFrom] = useState(params.get("received_date_from") || "");
  const [dateTo, setDateTo] = useState(params.get("received_date_to") || "");

  useEffect(() => {
    setCouncilId(params.get("council_id") || "");
    setStatus(params.get("status") || "");
    setPostcode(params.get("postcode") || "");
    setQ(params.get("q") || "");
    setFormerDistrict(params.get("former_district") || "");
    setDateFrom(params.get("received_date_from") || "");
    setDateTo(params.get("received_date_to") || "");
  }, [params]);

  function apply(e: React.FormEvent) {
    e.preventDefault();
    const p = new URLSearchParams();
    if (council_id) p.set("council_id", council_id);
    if (status) p.set("status", status);
    if (postcode) p.set("postcode", postcode);
    if (q) p.set("q", q);
    if (former_district) p.set("former_district", former_district);
    if (dateFrom) p.set("received_date_from", dateFrom);
    if (dateTo) p.set("received_date_to", dateTo);
    p.set("skip", "0"); // reset to first page on new filter
    p.set("limit", params.get("limit") || "20");
    router.push(`?${p.toString()}`);
  }

  function clear() {
    router.push("?");
  }

  // Councils come back as a paginated list. Try both shapes (array or {items}).
  const councils: { id: number; name: string }[] = Array.isArray(councilsData)
    ? (councilsData as unknown as { id: number; name: string }[])
    : (((councilsData as unknown as { items?: { id: number; name: string }[] })?.items) ??
      []);

  return (
    <form onSubmit={apply} className="space-y-3 rounded-md border bg-card p-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-4">
        <div>
          <Label htmlFor="council">Council</Label>
          <Select value={council_id || "all"} onValueChange={(v) => setCouncilId(v === "all" ? "" : v)}>
            <SelectTrigger id="council">
              <SelectValue placeholder={councilsLoading ? "Loading…" : "All councils"} />
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
          <Select value={status || "any"} onValueChange={(v) => setStatus(v === "any" ? "" : v)}>
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
            value={former_district}
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

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit">Apply filters</Button>
        <Button type="button" variant="outline" onClick={clear}>
          Clear
        </Button>
      </div>
    </form>
  );
}
