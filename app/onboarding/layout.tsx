/**
 * Onboarding chrome — its own layout (no app TopNav) for the post-signup
 * councils -> bundles -> checkout flow. Server component: guards the session,
 * then mounts the client OnboardingProvider (which holds the cross-step
 * selection) + the stepper. The layout persists across the three steps, so
 * the in-memory selection survives navigation between them.
 */
import { redirect } from "next/navigation";

import { auth } from "@/auth";

import { OnboardingStepper } from "./_components/OnboardingStepper";
import { OnboardingProvider } from "./_store";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <OnboardingProvider>
          <OnboardingStepper />
          <div className="mt-6">{children}</div>
        </OnboardingProvider>
      </div>
    </div>
  );
}
