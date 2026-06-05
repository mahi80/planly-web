/**
 * NextAuth (Auth.js v5) configuration. Single source of truth for auth.
 *
 * Strategy: JWT sessions. The user authenticates via our backend's
 * `POST /auth/login`; we store the returned `access_token` + `refresh_token`
 * in the NextAuth JWT. The `jwt` callback transparently renews the short-lived
 * access token via `POST /auth/refresh` before it expires, so the browser
 * session keeps working without forcing a re-login.
 *
 * When AWS P4 lands (Cognito SSO), swap the Credentials provider for the
 * Cognito provider — session/JWT plumbing stays the same.
 */
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Renew the access token using the stored refresh token. Returns a new token
 * object; on failure flags `error` so the session can prompt a re-login.
 */
async function refreshAccessToken(token: Record<string, unknown>) {
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: token.refreshToken }),
    });
    if (!res.ok) throw new Error(`refresh failed: ${res.status}`);
    const data = (await res.json()) as { access_token: string; expires_in: number };
    return {
      ...token,
      accessToken: data.access_token,
      accessTokenExpires: Date.now() + data.expires_in * 1000,
      error: undefined,
    };
  } catch {
    // Refresh failed (revoked/expired refresh token) — surface an error so
    // the UI can route the user back to /login.
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Hit the backend's /auth/login.
        const res = await fetch(`${API_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
          }),
        });

        if (!res.ok) return null;
        const data = (await res.json()) as {
          access_token: string;
          refresh_token: string;
          expires_in: number;
        };
        if (!data.access_token) return null;

        // Get user profile so the session carries email/role.
        const meRes = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${data.access_token}` },
        });
        if (!meRes.ok) return null;
        const me = (await meRes.json()) as {
          id: string;
          email: string;
          role?: string;
          tenant_id?: string;
        };

        return {
          id: me.id,
          email: me.email,
          name: me.email,
          // Custom fields below are persisted into the JWT via the `jwt` callback.
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          accessTokenExpires: Date.now() + data.expires_in * 1000,
          role: me.role,
          tenantId: me.tenant_id,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      // On sign-in, lift custom fields from the User onto the JWT.
      if (user) {
        // @ts-expect-error -- user is augmented with our custom shape above
        token.accessToken = user.accessToken;
        // @ts-expect-error
        token.refreshToken = user.refreshToken;
        // @ts-expect-error
        token.accessTokenExpires = user.accessTokenExpires;
        // @ts-expect-error
        token.role = user.role;
        // @ts-expect-error
        token.tenantId = user.tenantId;
        return token;
      }

      // Subsequent requests: reuse the access token until it's near expiry
      // (60s skew buffer), then transparently refresh it.
      const expires = token.accessTokenExpires as number | undefined;
      if (expires && Date.now() < expires - 60_000) {
        return token;
      }
      if (!token.refreshToken) return token;
      return await refreshAccessToken(token as Record<string, unknown>);
    },
    async session({ session, token }) {
      // Surface the JWT custom fields into the session so client + server
      // components can read them via auth().
      // @ts-expect-error -- augmenting the session shape
      session.accessToken = token.accessToken;
      // @ts-expect-error
      session.role = token.role;
      // @ts-expect-error
      session.tenantId = token.tenantId;
      // @ts-expect-error -- non-undefined when a refresh failed
      session.error = token.error;
      return session;
    },
  },
});
