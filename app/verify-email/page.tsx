/**
 * Email-verification page. Server wrapper so the client form (which reads
 * ?token via useSearchParams) can be <Suspense>-bounded. Public route —
 * excluded from the auth matcher in middleware.ts.
 */
import { Suspense } from "react";

import { VerifyEmailForm } from "./VerifyEmailForm";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailForm />
    </Suspense>
  );
}
