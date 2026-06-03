/**
 * In-memory onboarding state, shared across the councils -> bundles ->
 * checkout steps. Provided by app/onboarding/layout.tsx, which persists
 * across navigations within the /onboarding/* segment (Next.js keeps the
 * layout mounted), so the selection survives step-to-step navigation.
 *
 * It is NOT persisted across a hard refresh — each step guards against an
 * empty upstream selection and redirects back to the start.
 */
"use client";

import { createContext, useContext, useMemo, useState } from "react";

export type OnboardingChoice =
  | { tier: "bundle"; bundleId: string }
  | { tier: "per_council"; councilIds: number[] };

type OnboardingState = {
  councilIds: number[];
  setCouncilIds: (ids: number[]) => void;
  choice: OnboardingChoice | null;
  setChoice: (c: OnboardingChoice | null) => void;
  reset: () => void;
};

const OnboardingContext = createContext<OnboardingState | null>(null);

export function OnboardingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [councilIds, setCouncilIds] = useState<number[]>([]);
  const [choice, setChoice] = useState<OnboardingChoice | null>(null);

  const value = useMemo<OnboardingState>(
    () => ({
      councilIds,
      setCouncilIds,
      choice,
      setChoice,
      reset: () => {
        setCouncilIds([]);
        setChoice(null);
      },
    }),
    [councilIds, choice],
  );

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding(): OnboardingState {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return ctx;
}
