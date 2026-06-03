/**
 * /account — profile + plan/billing.
 *
 * The plan card is driven by GET /billing/subscription (BillingSection); the
 * checkout flow (stubbed) lives under /onboarding.
 */
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { BillingSection } from "./BillingSection";

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const email = session.user.email ?? "";
  const role = (session as { role?: string }).role ?? "user";
  const tenantId = (session as { tenantId?: string }).tenantId ?? "";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Account</h1>
        <p className="text-sm text-muted-foreground">Your profile and plan.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2 text-sm">
              <div className="grid grid-cols-[100px_1fr] gap-2">
                <dt className="text-muted-foreground">Email</dt>
                <dd>{email}</dd>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-2">
                <dt className="text-muted-foreground">Role</dt>
                <dd>
                  <Badge variant={role === "platform_admin" ? "default" : "secondary"}>
                    {role}
                  </Badge>
                </dd>
              </div>
              {tenantId && (
                <div className="grid grid-cols-[100px_1fr] gap-2">
                  <dt className="text-muted-foreground">Tenant</dt>
                  <dd className="font-mono text-xs">{tenantId}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        <BillingSection />
      </div>
    </div>
  );
}
