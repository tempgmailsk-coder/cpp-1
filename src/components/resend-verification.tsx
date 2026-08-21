"use client";

import { useState } from "react";
import Link from "next/link";
import { Alert, Field, TextInput, btnPrimary } from "@/components/ui";

export function ResendVerification() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [demoLink, setDemoLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Request failed.");
        return;
      }
      setDone(true);
      setDemoLink(data.demoVerifyLink ?? null);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      {done ? (
        <div className="space-y-4">
          <Alert kind="success">
            If an account exists for this email, a new verification link has been
            generated.
          </Alert>
          {demoLink ? (
            <div className="rounded-xl border border-neutral-200 bg-white p-4 text-sm">
              <p className="font-semibold text-neutral-900">Demo verification link</p>
              <a
                href={demoLink}
                className="mt-2 inline-block break-all text-xs font-medium text-neutral-700 underline underline-offset-2"
              >
                {demoLink}
              </a>
            </div>
          ) : null}
          <Link href="/login" className={btnPrimary}>
            Back to Login
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-neutral-200 bg-white p-6">
          {error ? <Alert kind="error">{error}</Alert> : null}
          <Field label="Registered email address" htmlFor="resendEmail" required>
            <TextInput
              id="resendEmail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </Field>
          <button type="submit" disabled={busy} className={`${btnPrimary} w-full`}>
            {busy ? "Sending…" : "Send Verification Link"}
          </button>
        </form>
      )}
    </div>
  );
}
