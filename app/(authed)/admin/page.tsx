/**
 * /admin — platform_admin only. Server-side gates via session.role, then
 * delegates rendering to a client component that fetches schedules + health.
 */
import { notFound } from "next/navigation";

import { auth } from "@/auth";

import { AdminBoard } from "./AdminBoard";

export default async function AdminPage() {
  const session = await auth();
  const role = (session as { role?: string } | null)?.role;
  if (role !== "platform_admin") {
    // 404 (not 403) — don't leak that the route exists to non-admins.
    notFound();
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        <p className="text-sm text-muted-foreground">
          Read-only view of scrape configuration. Schedules and per-council
          tier reassignment are edited via the Jinja admin harness on the
          backend.
        </p>
      </div>
      <AdminBoard />
    </div>
  );
}
