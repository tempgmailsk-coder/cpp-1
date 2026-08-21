"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert, Field, TextInput, btnPrimary } from "@/components/ui";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ text: string; link?: string } | null>(null);
  const [needsOtp, setNeedsOtp] = useState(false);
  const [demoOtp, setDemoOtp] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onPasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      identifier: String(fd.get("identifier") ?? ""),
      password: String(fd.get("password") ?? ""),
    };
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.needsEmailVerification) {
          setError(data.error);
          if (data.demoVerifyLink) {
            setNotice({
              text: "Resend your verification link below (demo environment):",
              link: data.demoVerifyLink,
            });
          }
        } else {
          setError(data.error ?? "Sign-in failed.");
        }
        return;
      }
      if (data.needsOtp) {
        setNeedsOtp(true);
        setDemoOtp(data.demoOtp ?? null);
        setHint(data.hint ?? null);
        return;
      }
      router.push(data.redirect ?? "/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function onOtpSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp: String(fd.get("otp") ?? "") }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Verification failed.");
        return;
      }
      router.push(data.redirect ?? "/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      {error ? <Alert kind="error">{error}</Alert> : null}
      {notice ? (
        <Alert kind="info">
          <p>{notice.text}</p>
          {notice.link ? (
            <a
              href={notice.link}
              className="mt-1 inline-block break-all text-xs font-medium text-neutral-700 underline underline-offset-2"
            >
              {notice.link}
            </a>
          ) : null}
        </Alert>
      ) : null}

      {needsOtp ? (
        <form onSubmit={onOtpSubmit} className="space-y-4 rounded-xl border border-neutral-200 bg-white p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-500">
            Two-step verification
          </h2>
          {hint ? <p className="text-sm text-neutral-600">{hint}</p> : null}
          {demoOtp ? (
            <Alert kind="info">
              Demo environment — your verification code is <strong>{demoOtp}</strong>.
            </Alert>
          ) : null}
          <Field label="6-digit code" htmlFor="otp" required>
            <TextInput id="otp" name="otp" inputMode="numeric" maxLength={6} placeholder="000000" />
          </Field>
          <button type="submit" disabled={submitting} className={`${btnPrimary} w-full`}>
            {submitting ? "Verifying…" : "Verify & Sign In"}
          </button>
        </form>
      ) : (
        <form onSubmit={onPasswordSubmit} className="space-y-4 rounded-xl border border-neutral-200 bg-white p-6">
          <Field label="Email address or Member ID" htmlFor="identifier" required>
            <TextInput
              id="identifier"
              name="identifier"
              placeholder="you@example.com or CPP-2026-00001"
              autoComplete="username"
            />
          </Field>
          <Field label="Password" htmlFor="password" required>
            <TextInput
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
            />
          </Field>
          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-neutral-600 underline underline-offset-2 hover:text-neutral-900"
            >
              Forgot password?
            </Link>
          </div>
          <button type="submit" disabled={submitting} className={`${btnPrimary} w-full py-3`}>
            {submitting ? "Signing in…" : "Sign In"}
          </button>
        </form>
      )}

      <p className="text-center text-sm text-neutral-500">
        Not a member yet?{" "}
        <Link href="/register" className="font-semibold text-neutral-900 underline underline-offset-2">
          Register
        </Link>
      </p>
    </div>
  );
}
