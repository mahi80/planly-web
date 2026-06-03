/**
 * Onboarding step 3 — confirm + activate. Stubbed checkout (no card): posts
 * to /billing/checkout, which activates the subscription directly. On success
 * the tenant is entitled, so we route to /search.
 */
"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type ApiError } from "@/lib/api/client";
import { formatPricePence } from "@/lib/format";
import { useBundles, useCheckout, type CheckoutPayload } from "@/lib/queries";

import { useOnboarding } from "../_store";

const PER_COUNCIL_PENCE = 1500;

export default function CheckoutPage() {
  const router = useRouter();
  const { choice, reset } = useOnboarding();
  const { data: bundles } = useBundles();
  const checkout = useCheckout();

  // Guard: a hard refresh wipes the in-memory store — restart onboarding.
  useEffect(() => {
    if (!choice) router.replace("/onboarding/councils");
  }, [choice, router]);

  if (!choice) return null;

  const bundle =
    choice.tier === "bundle"
      ? (bundles ?? []).find((b) => b.id === choice.bundleId)
      : undefined;
  const totalPence =
    choice.tier === "bundle"
      ? bundle?.monthly_price_pence ?? 0
      : choice.councilIds.length * PER_COUNCIL_PENCE;

  async function activate() {
    const payload: CheckoutPayload =
      choice!.tier === "bundle"
        ? { tier: "bundle", bundle_id: choice!.bundleId }
        : { tier: "per_council", council_ids: choice!.councilIds };
    try {
      await checkout.mutateAsync(payload);
    } catch (e) {
      const err = e as ApiError;
      const detail = (err.detail as { detail?: string } | undefined)?.detail;
      toast.error("Checkout failed", {
        description: detail || "Please review your selection and try again.",
      });
      return;
    }
    toast.success("Subscription activated");
    reset();
    router.push("/search");
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Confirm your plan
        </h1>
        <p className="text-sm text-muted-foreground">
          No card required — this is a stubbed checkout for the preview.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Order summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {choice.tier === "bundle" ? (
            <div className="flex justify-between">
              <span>{bundle?.name ?? "Regional bundle"}</span>
              <span>{formatPricePence(totalPence)}/mo</span>
            </div>
          ) : (
            <div className="flex justify-between">
              <span>
                {choice.councilIds.length} councils ×{" "}
                {formatPricePence(PER_COUNCIL_PENCE)}
              </span>
              <span>{formatPricePence(totalPence)}/mo</span>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => router.push("/onboarding/bundles")}
        >
          ← Back
        </Button>
        <Button onClick={activate} disabled={checkout.isPending}>
          {checkout.isPending ? "Activating…" : "Activate subscription"}
        </Button>
      </div>
    </div>
  );
}
