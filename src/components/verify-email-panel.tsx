"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Alert, btnPrimary } from "@/components/ui";

export function VerifyEmailPanel({ token }: { token: string }) {
  const [state, setState] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function verify() {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setState("error");
          setError(data.error ?? "Verification failed.");
          return;
        }
        setState("success");
        if (data.redirect) {
          window.location.href = data.redirect;
        }
      } catch {
        if (!cancelled) {
          setState("error");
          setError("Network error. Please try again.");
        }
      }
    }
    void verify();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="mx-auto max-w-lg">
      {state === "loading" ? (
        <Alert kind="info">Verifying your email address…</Alert>
      ) : null}
      {state === "success" ? (
        <div className="space-y-4">
          <Alert kind="success">
            <p className="font-semibold">Email verified</p>
            <p className="mt-1">
              Your CPP member profile is now active. You will be redirected to your
              dashboard.
            </p>
          </Alert>
          <Link href="/dashboard" className={btnPrimary}>
            Go to Dashboard
          </Link>
        </div>
      ) : null}
      {state === "error" ? (
        <div className="space-y-4">
          <Alert kind="error">{error}</Alert>
          <div className="flex flex-wrap gap-3">
            <Link href="/login" className={btnPrimary}>
              Go to Login
            </Link>
            <Link
              href="/verify-email?token=resend"
              className="inline-flex items-center rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
            >
              Resend Verification
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
