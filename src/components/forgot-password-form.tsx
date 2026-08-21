"use client";

import { useState } from "react";
import Link from "next/link";
import { Alert, Field, TextInput, btnPrimary } from "@/components/ui";

export function ForgotPasswordForm() {
  const [done, setDone] = useState(false);
  const [demoLink, setDemoLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: String(fd.get("email") ?? "") }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Request failed.");
        return;
      }
      setDone(true);
      setDemoLink(data.demoResetLink ?? null);
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
            If an account exists for this email, a password reset link has been sent. The
            link is valid for 60 minutes.
          </Alert>
          {demoLink ? (
            <div className="rounded-xl border border-neutral-200 bg-white p-4 text-sm">
              <p className="font-semibold text-neutral-900">Demo reset link</p>
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
          <p className="text-sm leading-relaxed text-neutral-600">
            Enter your registered email address and we will send you a link to reset your
            password.
          </p>
          <Field label="Email address" htmlFor="forgotEmail" required>
            <TextInput id="forgotEmail" name="email" type="email" autoComplete="email" />
          </Field>
          <button type="submit" disabled={busy} className={`${btnPrimary} w-full`}>
            {busy ? "Sending…" : "Send Reset Link"}
          </button>
          <p className="text-center text-xs text-neutral-500">
            <Link href="/login" className="font-semibold text-neutral-900 underline underline-offset-2">
              Back to Login
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}
