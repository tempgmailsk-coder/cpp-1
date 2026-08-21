"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Field, TextArea, Select, btnPrimary, btnSecondary } from "@/components/ui";
import { STATUS_TRANSITIONS, STATUS_LABELS, METHOD_LABELS } from "@/lib/constants";
import type { ApplicationStatus } from "@/db/schema";

export function TransitionButtons({
  applicationId,
  status,
  canAppoint,
}: {
  applicationId: number;
  status: string;
  canAppoint: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [noteFor, setNoteFor] = useState<string | null>(null);

  const allowed = STATUS_TRANSITIONS[status as ApplicationStatus] ?? [];
  const targets = allowed.filter((s) => s !== "appointed" && s !== "withdrawn");

  async function transition(toStatus: string, note: string) {
    setBusy(toStatus);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/applications/${applicationId}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toStatus, note }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "Transition failed.");
        return;
      }
      setMessage(
        `Application moved to ${STATUS_LABELS[toStatus as ApplicationStatus] ?? toStatus}. The member was notified by email.`
      );
      setNoteFor(null);
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  if (targets.length === 0) {
    return (
      <p className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-xs text-neutral-500">
        {status === "appointed"
          ? "This application resulted in an appointment. Managed from Appointment Management."
          : status === "rejected" || status === "withdrawn"
            ? "This application is closed. No further transitions are permitted."
            : "This application is awaiting the appointment stage."}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {message ? <Alert kind="info">{message}</Alert> : null}
      {noteFor ? (
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <p className="text-xs font-semibold text-neutral-700">
            Optional note to the member — moving to{" "}
            {STATUS_LABELS[noteFor as ApplicationStatus] ?? noteFor}
          </p>
          <textarea
            id={`note-${noteFor}`}
            className="mt-2 min-h-[64px] w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
            placeholder="e.g. Documents under verification…"
          />
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById(`note-${noteFor}`) as HTMLTextAreaElement;
                void transition(noteFor, el?.value ?? "");
              }}
              disabled={busy !== null}
              className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-neutral-700 disabled:opacity-50"
            >
              Confirm
            </button>
            <button
              type="button"
              onClick={() => setNoteFor(null)}
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-600"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {targets.map((t) => (
            <button
              key={t}
              type="button"
              disabled={busy !== null}
              onClick={() => setNoteFor(t)}
              className={
                t === "rejected"
                  ? "rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                  : "rounded-lg bg-neutral-900 px-3 py-2 text-sm font-semibold text-white hover:bg-neutral-700 disabled:opacity-50"
              }
            >
              {busy === t ? "…" : `Move to ${STATUS_LABELS[t] ?? t}`}
            </button>
          ))}
        </div>
      )}
      {canAppoint && status === "selected" ? (
        <p className="text-xs text-neutral-500">
          This applicant is selected — record the appointment from the Appointment
          Management page to generate the reference number and official email.
        </p>
      ) : null}
    </div>
  );
}

export function NoteForm({ applicationId }: { applicationId: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch(`/api/admin/applications/${applicationId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: String(fd.get("note") ?? "") }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "Could not add note.");
        return;
      }
      setMessage("Note added.");
      e.currentTarget.reset();
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {message ? <Alert kind="info">{message}</Alert> : null}
      <Field label="Add internal note (visible to administrators only)" htmlFor="admin-note">
        <TextArea id="admin-note" name="note" rows={2} placeholder="e.g. Verified references; strong organizational record." />
      </Field>
      <button type="submit" disabled={busy} className={btnSecondary}>
        {busy ? "Adding…" : "Add Note"}
      </button>
    </form>
  );
}

export function AppointmentForm({
  applicationId,
  positionName,
  method,
  authorities,
  canAppoint,
}: {
  applicationId: number;
  positionName: string;
  method: string;
  authorities: { id: number; name: string; role: string; label: string }[];
  canAppoint: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [authority, setAuthority] = useState<string>(
    authorities[0]?.name ?? ""
  );

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canAppoint) {
      setMessage({
        ok: false,
        text: "You are not authorized to trigger official appointment notifications.",
      });
      return;
    }
    setBusy(true);
    setMessage(null);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/admin/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId,
          appointingAuthority: String(fd.get("appointingAuthority") ?? ""),
          authorityRole: String(fd.get("authorityRole") ?? ""),
          appointmentMethod: method,
          effectiveDate: String(fd.get("effectiveDate") ?? ""),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ ok: false, text: data.error ?? "Appointment could not be confirmed." });
        return;
      }
      setMessage({
        ok: true,
        text: `Appointment confirmed. Reference ${data.appointment.referenceNumber}. Official email sent to the member's registered address.`,
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl border-2 border-emerald-200 bg-emerald-50/40 p-5">
      <div>
        <p className="text-sm font-bold uppercase tracking-wider text-emerald-800">
          Confirm Appointment — {positionName}
        </p>
        <p className="mt-1 text-xs text-emerald-700">
          Appointment method: {METHOD_LABELS[method as keyof typeof METHOD_LABELS] ?? method}.
          This generates the appointment reference number, stores the appointment record,
          and sends the official appointment email.
        </p>
      </div>
      {message ? (
        <Alert kind={message.ok ? "success" : "error"}>{message.text}</Alert>
      ) : null}
      <Field label="Appointing Authority" htmlFor="appointingAuthority" required>
        {authorities.length > 0 ? (
          <Select
            id="appointingAuthority"
            name="appointingAuthority"
            value={authority}
            onChange={(e) => {
              setAuthority(e.target.value);
              const selected = authorities.find((a) => a.name === e.target.value);
              const roleInput = document.getElementById("authorityRole") as HTMLInputElement;
              if (roleInput && selected) roleInput.value = selected.role;
            }}
          >
            {authorities.map((a) => (
              <option key={a.id} value={a.name}>
                {a.label}
              </option>
            ))}
          </Select>
        ) : (
          <input
            id="appointingAuthority"
            name="appointingAuthority"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            placeholder="e.g. National Party Leader"
            required
          />
        )}
        <input id="authorityRole" name="authorityRole" type="hidden" defaultValue={authorities[0]?.role ?? ""} />
      </Field>
      <Field label="Effective Date" htmlFor="effectiveDate" required>
        <input
          id="effectiveDate"
          name="effectiveDate"
          type="date"
          required
          className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm"
        />
      </Field>
      <button
        type="submit"
        disabled={busy || !canAppoint}
        className="inline-flex items-center justify-center rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? "Confirming…" : "Confirm Appointment & Send Official Email"}
      </button>
      {!canAppoint ? (
        <p className="text-xs text-red-700">
          Only authorized appointment authorities can trigger official appointment
          notifications.
        </p>
      ) : null}
    </form>
  );
}
