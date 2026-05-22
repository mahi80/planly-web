/**
 * Layout for every authenticated page. Renders the top nav and slots the page body.
 * Server component — reads session once per request, then forwards a small slice
 * (email, role) to the client nav for the menu state.
 */
import { redirect } from "next/navigation";

import { auth } from "@/auth";

import { TopNav } from "./_components/TopNav";

export default async function AuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNav
        email={session.user.email || "user"}
        role={(session as { role?: string }).role}
      />
      <main className="container mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
