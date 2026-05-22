/**
 * /account — user profile + plan upgrade placeholder.
 *
 * Stripe wiring is pending Simon's Q28 pricing decision; until then the
 * Upgrade button is disabled and explains the state.
 */
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
        <p className="text-sm text-muted-foreground">
          Your profile and plan.
        </p>
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

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">Currently on the <strong>Starter</strong> plan.</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Stripe checkout integration is queued — see Simon&apos;s Q28
              pricing decision. Once live, the button below will route to a
              Stripe Customer Portal session.
            </p>
            <div className="mt-4">
              <Button disabled>Upgrade plan — coming soon</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
