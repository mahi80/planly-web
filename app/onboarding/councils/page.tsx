/**
 * Onboarding step 1 — pick councils to monitor, grouped by region. The
 * selection is stashed in the onboarding store and carried to the bundle /
 * checkout steps (per-council tier needs >= 3).
 */
"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCouncilsFull, type CouncilFull } from "@/lib/queries";

import { useOnboarding } from "../_store";

export default function SelectCouncilsPage() {
  const router = useRouter();
  const { councilIds, setCouncilIds } = useOnboarding();
  const { data: councils, isLoading, isError, refetch } = useCouncilsFull();
  const [selected, setSelected] = useState<number[]>(councilIds);

  const grouped = useMemo(() => {
    const m = new Map<string, CouncilFull[]>();
    for (const c of councils ?? []) {
      const key = c.region ?? "Other";
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(c);
    }
    return Array.from(m.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [councils]);

  function toggle(id: number) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function goToBundles() {
    setCouncilIds(selected);
    router.push("/onboarding/bundles");
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading councils…</p>;
  }
  if (isError) {
    return (
      <Card>
        <CardContent className="py-6 text-sm">
          Couldn&apos;t load councils.{" "}
          <Button variant="link" className="px-1" onClick={() => refetch()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Choose your councils
        </h1>
        <p className="text-sm text-muted-foreground">
          Select the planning authorities you want to monitor. Pick at least 3
          for the per-council plan, or choose a regional bundle next.
        </p>
      </div>

      {grouped.map(([region, list]) => (
        <Card key={region}>
          <CardHeader>
            <CardTitle className="text-base">{region}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {list.map((c) => (
              <label
                key={c.id}
                className="flex cursor-pointer items-center gap-2 text-sm"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={selected.includes(c.id)}
                  onChange={() => toggle(c.id)}
                />
                <span>
                  {c.name}
                  {c.sub_region ? (
                    <span className="text-muted-foreground"> · {c.sub_region}</span>
                  ) : null}
                </span>
              </label>
            ))}
          </CardContent>
        </Card>
      ))}

      <div className="fixed inset-x-0 bottom-0 border-t bg-background/95 backdrop-blur">
        <div className="container mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <span className="text-sm text-muted-foreground">
            {selected.length} selected
          </span>
          <Button onClick={goToBundles}>Continue</Button>
        </div>
      </div>
    </div>
  );
}
