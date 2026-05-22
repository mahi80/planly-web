/**
 * Landing — redirect by auth state.
 * Logged in → /search
 * Logged out → /login
 *
 * (When a marketing site is built, replace this with the static landing.)
 */
import { redirect } from "next/navigation";

import { auth } from "@/auth";

export default async function HomePage() {
  const session = await auth();
  if (session?.user) {
    redirect("/search");
  }
  redirect("/login");
}
