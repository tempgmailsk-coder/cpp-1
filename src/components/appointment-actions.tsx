"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ResendAppointmentEmail({
  appointmentId,
  canResend,
}: {
  appointmentId: number;
  canResend: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function resend() {
    if (!canResend) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/appointments/${appointmentId}/resend`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "Resend failed.");
        return;
      }
      setMessage("Official appointment email reissued to the member's registered address.");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={resend}
        disabled={busy || !canResend}
        title={
          canResend
            ? "Re-send the official appointment email"
            : "Only authorized appointment authorities can send official emails"
        }
        className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {busy ? "Sending…" : "Resend Official Email"}
      </button>
      {message ? <span className="text-xs text-emerald-700">{message}</span> : null}
    </span>
  );
}
