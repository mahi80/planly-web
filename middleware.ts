/**
 * Route protection middleware.
 *
 * Auth.js's `auth` export doubles as a Next.js middleware. Anything matched
 * by the matcher below requires a valid session — Auth.js redirects to
 * /login (configured in auth.ts:pages.signIn) on miss.
 *
 * Excluded from the matcher:
 *   - /api/auth/*    NextAuth's own routes (would deadlock)
 *   - /login         the sign-in page itself
 *   - _next/*        Next's static assets
 *   - favicon.ico    favicon
 *
 * Everything else (including /api/* proxy routes if we add them) is gated.
 */
export { auth as middleware } from "@/auth";

export const config = {
  matcher: ["/((?!api/auth|login|_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
