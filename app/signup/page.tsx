/**
 * Sign-up page. Server wrapper so the client form can be <Suspense>-bounded
 * (mirrors /login). Public route — excluded from the auth matcher in
 * middleware.ts.
 */
import { Suspense } from "react";

import { SignupForm } from "./SignupForm";

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  );
}
