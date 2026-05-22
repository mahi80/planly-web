/**
 * Top navigation bar — links + signed-in user + sign-out.
 * Client component because of the sign-out click handler and route-active state.
 */
"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PRIMARY_LINKS = [
  { href: "/search", label: "Search" },
  { href: "/saved-searches", label: "Saved" },
  { href: "/letters", label: "Letters" },
  { href: "/leads", label: "Leads" },
];

export function TopNav({ email, role }: { email: string; role?: string }) {
  const pathname = usePathname();
  const isAdmin = role === "platform_admin";

  return (
    <header className="border-b bg-card">
      <div className="container mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/search" className="text-lg font-semibold tracking-tight">
            PD Intel
          </Link>
          <nav className="flex items-center gap-1">
            {PRIMARY_LINKS.map((link) => {
              const active =
                pathname === link.href || pathname.startsWith(link.href + "/");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded px-3 py-1.5 text-sm transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
            {isAdmin && (
              <Link
                href="/admin"
                className={cn(
                  "rounded px-3 py-1.5 text-sm transition-colors",
                  pathname.startsWith("/admin")
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                Admin
              </Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/account"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            {email}
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}
