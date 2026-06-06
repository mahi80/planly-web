/**
 * Onboarding step 2 — pick a regional bundle, or continue with the councils
 * chosen in step 1 (per-council tier, min 3). The choice is stashed in the
 * onboarding store and confirmed on the checkout step.
 */
"use client";

import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatPricePence } from "@/lib/format";
import { useBundles } from "@/lib/queries";

import { useOnboarding } from "../_store";

const PER_COUNCIL_PENCE = 1500; // £15/council/mo (matches backend stub)

export default function SelectBundlesPage() {
  const router = useRouter();
  const { councilIds, setChoice } = useOnboarding();
  const { data: bundles, isLoading, isError, refetch } = useBundles();

  function chooseBundle(bundleId: string) {
    setChoice({ tier: "bundle", bundleId });
    router.push("/onboarding/checkout");
  }

  function choosePerCouncil() {
    setChoice({ tier: "per_council", councilIds });
    router.push("/onboarding/checkout");
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading plans…</p>;
  }
  if (isError) {
    return (
      <Card>
        <CardContent className="py-6 text-sm">
          Couldn&apos;t load bundles.{" "}
          <Button variant="link" className="px-1" onClick={() => refetch()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Choose a plan</h1>
        <p className="text-sm text-muted-foreground">
          Pick a regional bundle, or continue with the councils you selected.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {(bundles ?? []).map((b) => (
          <Card
            key={b.id}
            className="flex flex-col transition hover:ring-2 hover:ring-primary/40"
          >
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">{b.name}</CardTitle>
                <Badge variant="secondary">{b.region_key}</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1 text-sm">
              <p className="text-2xl font-semibold">
                {formatPricePence(b.monthly_price_pence)}
                <span className="text-sm font-normal text-muted-foreground">
                  /mo
                </span>
              </p>
              <p className="mt-1 text-muted-foreground">
                {b.council_count} councils included
              </p>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={() => chooseBundle(b.id)}>
                Select this bundle
              </Button>
            </CardFooter>
          </Card>
        ))}
        {(bundles ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">
            No bundles available right now — continue with the per-council plan.
          </p>
        )}
      </div>

      <Card>
        <CardContent className="flex items-center justify-between gap-4 py-4">
          <div className="text-sm">
            <p className="font-medium">Per-council plan</p>
            <p className="text-muted-foreground">
              {councilIds.length} selected · {formatPricePence(PER_COUNCIL_PENCE)}
              /council/mo (min 3)
            </p>
          </div>
          <Button
            variant="outline"
            disabled={councilIds.length < 3}
            onClick={choosePerCouncil}
          >
            Continue per-council
          </Button>
        </CardContent>
      </Card>

      <Button variant="ghost" onClick={() => router.push("/onboarding/councils")}>
        ← Back to councils
      </Button>
    </div>
  );
}
