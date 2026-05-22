/**
 * Sign-in page. Server component wrapper so we can `<Suspense>` the
 * client-side form (which uses useSearchParams).
 */
import { Suspense } from "react";

import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
