/**
 * Email verification. The token arrives via ?token= (auto-submitted once) or
 * is pasted manually. NOTE: email delivery isn't wired yet — the backend logs
 * the verification token to the server logs; this screen is the dev stopgap
 * for consuming it.
 */
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { apiFetch, type ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function VerifyEmailForm() {
  const router = useRouter();
  const params = useSearchParams();
  const tokenFromUrl = params.get("token") ?? "";
  const [token, setToken] = useState(tokenFromUrl);
  const [verifying, setVerifying] = useState(false);
  const autoFired = useRef(false);

  async function verify(t: string) {
    const value = t.trim();
    if (!value) {
      toast.error("Enter the verification token");
      return;
    }
    setVerifying(true);
    try {
      await apiFetch("/auth/verify-email", {
        method: "POST",
        body: JSON.stringify({ token: value }),
      });
    } catch (e) {
      setVerifying(false);
      const err = e as ApiError;
      toast.error("Verification failed", {
        description:
          err.status === 400
            ? "This token is invalid, expired, or already used."
            : "Please try again.",
      });
      return;
    }
    setVerifying(false);
    toast.success("Email verified");
    router.push("/onboarding/councils");
    router.refresh();
  }

  // Auto-submit once if a token is present in the URL (guard against
  // React strict-mode double-invocation with a ref).
  useEffect(() => {
    if (tokenFromUrl && !autoFired.current) {
      autoFired.current = true;
      void verify(tokenFromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenFromUrl]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Verify your email</CardTitle>
          <CardDescription>
            Your account is created — confirm your email to continue.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Email delivery isn&apos;t wired up yet, so the verification token is
            printed in the API server logs for now. Paste it below.
          </p>
          <div className="space-y-2">
            <Label htmlFor="token">Verification token</Label>
            <Input
              id="token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="paste the token from the server logs"
            />
          </div>
          <Button
            className="w-full"
            disabled={verifying}
            onClick={() => verify(token)}
          >
            {verifying ? "Verifying…" : "Verify email"}
          </Button>
        </CardContent>
        <CardFooter className="justify-center">
          <button
            type="button"
            onClick={() => router.push("/onboarding/councils")}
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            Skip for now
          </button>
        </CardFooter>
      </Card>
    </main>
  );
}
