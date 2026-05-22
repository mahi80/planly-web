/**
 * /search — placeholder. Session 2 replaces this with the full search UI
 * (filters + paginated list).
 *
 * Server component — pre-fetches the council list for the filter dropdown
 * and the user's session.
 */
import { auth } from "@/auth";

export default async function SearchPage() {
  const session = await auth();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Search</h1>
      <p className="text-muted-foreground">
        Welcome, <strong>{session?.user?.email}</strong>. Search the 1,400+
        planning applications across 376 UK Local Planning Authorities.
      </p>

      <div className="rounded-md border bg-muted/30 p-6">
        <h2 className="mb-2 font-medium">Foundation check</h2>
        <p className="text-sm text-muted-foreground">
          You&rsquo;re authenticated. The search UI lands in Session 2 — filters
          (council, status, date range, postcode, full-text), paginated cards,
          former-district chip, and a clickable detail page.
        </p>
        <ul className="mt-4 list-disc pl-5 text-sm text-muted-foreground">
          <li>API client wired ✓</li>
          <li>Session JWT carries the backend access_token ✓</li>
          <li>
            Protected route — accessing /search without a session redirects to
            /login ✓
          </li>
        </ul>
      </div>
    </div>
  );
}
