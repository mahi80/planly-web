"use client";

import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const STEPS = [
  { href: "/onboarding/councils", label: "Councils" },
  { href: "/onboarding/bundles", label: "Plan" },
  { href: "/onboarding/checkout", label: "Checkout" },
];

export function OnboardingStepper() {
  const pathname = usePathname();
  const activeIdx = Math.max(
    0,
    STEPS.findIndex((s) => pathname.startsWith(s.href)),
  );

  return (
    <ol className="flex items-center gap-3 text-sm">
      {STEPS.map((s, i) => (
        <li key={s.href} className="flex items-center gap-2">
          <span
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full border text-xs font-medium",
              i <= activeIdx
                ? "border-primary bg-primary text-primary-foreground"
                : "border-muted-foreground/30 text-muted-foreground",
            )}
          >
            {i + 1}
          </span>
          <span
            className={cn(
              i === activeIdx ? "font-medium" : "text-muted-foreground",
            )}
          >
            {s.label}
          </span>
          {i < STEPS.length - 1 && (
            <span className="ml-1 h-px w-8 bg-muted-foreground/30" />
          )}
        </li>
      ))}
    </ol>
  );
}
