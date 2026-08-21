"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function WithdrawButton({ applicationId }: { applicationId: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function withdraw() {
    setBusy(true);
    try {
      const res = await fetch(`/api/applications/${applicationId}/withdraw`, {
        method: "POST",
      });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json().catch(() => null);
        alert(data?.error ?? "Withdrawal failed.");
      }
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <span className="flex items-center gap-2">
        <button
          type="button"
          onClick={withdraw}
          disabled={busy}
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
        >
          {busy ? "Withdrawing…" : "Confirm Withdrawal"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-600 hover:bg-neutral-50"
        >
          Cancel
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-600 transition hover:bg-red-50 hover:text-red-700"
    >
      Withdraw
    </button>
  );
}
