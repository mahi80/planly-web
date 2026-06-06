/**
 * Account billing card — current plan from GET /billing/subscription, or a
 * "choose a plan" CTA when the tenant has no subscription yet.
 */
"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatPricePence } from "@/lib/format";
import { useSubscription } from "@/lib/queries";

export function BillingSection() {
  const { data: sub, isLoading, isError } = useSubscription();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Plan &amp; billing</CardTitle>
      </CardHeader>
      <CardContent className="text-sm">
        {isLoading ? (
          <p className="text-muted-foreground">Loading plan…</p>
        ) : isError ? (
          <p className="text-destructive">Couldn&apos;t load your plan.</p>
        ) : !sub ? (
          <div className="space-y-3">
            <p>You don&apos;t have an active plan yet.</p>
            <Button asChild>
              <Link href="/onboarding/councils">Choose a plan</Link>
            </Button>
          </div>
        ) : (
          <dl className="space-y-2">
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Tier</dt>
              <dd>
                <Badge variant="secondary">{sub.tier}</Badge>
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Status</dt>
              <dd>
                <Badge variant={sub.status === "active" ? "default" : "secondary"}>
                  {sub.status}
                </Badge>
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Price</dt>
              <dd>{formatPricePence(sub.monthly_price_pence)}/mo</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Period</dt>
              <dd>
                {formatDate(sub.current_period_start)} –{" "}
                {formatDate(sub.current_period_end)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">
                Councils ({sub.councils.length})
              </dt>
              <dd className="mt-1 flex flex-wrap gap-1">
                {sub.councils.map((c) => (
                  <Badge key={c.id} variant="outline">
                    {c.name}
                  </Badge>
                ))}
              </dd>
            </div>
            <div className="pt-2">
              <Button variant="outline" disabled>
                Manage billing — coming soon
              </Button>
            </div>
          </dl>
        )}
      </CardContent>
    </Card>
  );
}
