"use client";

import { useState } from "react";
import Link from "next/link";
import { Alert, Field, TextInput, btnPrimary } from "@/components/ui";

export function ResetPasswordForm({ token }: { token: string }) {
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password: String(fd.get("password") ?? ""),
          confirmPassword: String(fd.get("confirmPassword") ?? ""),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Reset failed.");
        return;
      }
      setDone(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="space-y-4">
        <Alert kind="success">
          <p className="font-semibold">Password updated</p>
          <p className="mt-1">You can now sign in with your new password.</p>
        </Alert>
        <Link href="/login" className={btnPrimary}>
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-neutral-200 bg-white p-6">
      {error ? <Alert kind="error">{error}</Alert> : null}
      <Field label="New Password" htmlFor="password" required hint="At least 8 characters with letters and numbers.">
        <TextInput id="password" name="password" type="password" autoComplete="new-password" />
      </Field>
      <Field label="Confirm New Password" htmlFor="confirmPassword" required>
        <TextInput id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" />
      </Field>
      <button type="submit" disabled={busy} className={`${btnPrimary} w-full`}>
        {busy ? "Updating…" : "Reset Password"}
      </button>
    </form>
  );
}
