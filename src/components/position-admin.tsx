"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Field, TextInput, TextArea, Select, btnPrimary, btnSecondary } from "@/components/ui";
import { METHOD_LABELS } from "@/lib/constants";
import type { PositionRow } from "@/db/types";

export function PositionCreateForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const fd = new FormData(e.currentTarget);
    const responsibilities = String(fd.get("responsibilities") ?? "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const eligibility = String(fd.get("eligibility") ?? "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const payload = {
      positionName: String(fd.get("positionName") ?? ""),
      rank: String(fd.get("rank") ?? "100"),
      level: String(fd.get("level") ?? "national"),
      wing: String(fd.get("wing") ?? ""),
      state: String(fd.get("state") ?? ""),
      description: String(fd.get("description") ?? ""),
      responsibilities,
      appointmentMethod: String(fd.get("appointmentMethod") ?? "appointment"),
      eligibility,
      termInfo: String(fd.get("termInfo") ?? ""),
      vacancies: String(fd.get("vacancies") ?? "1"),
      vacancyStatus: String(fd.get("vacancyStatus") ?? "open"),
      applicationDeadline: String(fd.get("applicationDeadline") ?? ""),
      constitutionalReference: String(fd.get("constitutionalReference") ?? ""),
      requireVerification: fd.get("requireVerification") === "true",
      stateMatch: fd.get("stateMatch") === "true",
    };
    try {
      const res = await fetch("/api/admin/positions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "Position could not be created.");
        return;
      }
      setMessage("Position created.");
      setOpen(false);
      router.refresh();
    } catch {
      setMessage("Network error.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={btnPrimary}>
        + Create Position
      </button>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-xl border border-neutral-200 bg-white p-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-500">
          New Constitutional Position
        </h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs font-semibold text-neutral-500 underline underline-offset-2"
        >
          Cancel
        </button>
      </div>
      {message ? <Alert kind="info">{message}</Alert> : null}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <Field label="Position Name" htmlFor="np-name" required>
            <TextInput id="np-name" name="positionName" placeholder="e.g. National Secretary — Digital Assets" />
          </Field>
        </div>
        <Field label="Rank" htmlFor="np-rank" required>
          <TextInput id="np-rank" name="rank" type="number" defaultValue="100" />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Level" htmlFor="np-level" required>
          <Select id="np-level" name="level" defaultValue="national">
            <option value="national">National</option>
            <option value="state">State</option>
          </Select>
        </Field>
        <Field label="Wing" htmlFor="np-wing" required>
          <TextInput id="np-wing" name="wing" placeholder="e.g. Executive / Secretariat" />
        </Field>
        <Field label="State (if specific)" htmlFor="np-state">
          <TextInput id="np-state" name="state" placeholder="Leave blank for template" />
        </Field>
      </div>
      <Field label="Description" htmlFor="np-desc" required>
        <TextArea id="np-desc" name="description" rows={2} />
      </Field>
      <Field label="Responsibilities (one per line)" htmlFor="np-resp" required>
        <TextArea id="np-resp" name="responsibilities" rows={4} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Appointment Method" htmlFor="np-method" required hint="As defined by the applicable constitutional article.">
          <Select id="np-method" name="appointmentMethod" defaultValue="appointment">
            {Object.entries(METHOD_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
        </Field>
        <Field label="Term Information" htmlFor="np-term" required>
          <TextInput id="np-term" name="termInfo" placeholder="e.g. 3 years, renewable as per Constitution" />
        </Field>
      </div>
      <Field label="Eligibility (one per line)" htmlFor="np-elig" required>
        <TextArea id="np-elig" name="eligibility" rows={3} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Vacancies" htmlFor="np-vac" required>
          <TextInput id="np-vac" name="vacancies" type="number" defaultValue="1" />
        </Field>
        <Field label="Vacancy Status" htmlFor="np-vs" required>
          <Select id="np-vs" name="vacancyStatus" defaultValue="open">
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </Select>
        </Field>
        <Field label="Application Deadline" htmlFor="np-dl">
          <TextInput id="np-dl" name="applicationDeadline" type="date" />
        </Field>
      </div>
      <Field label="Constitutional Reference" htmlFor="np-ref">
        <TextInput id="np-ref" name="constitutionalReference" placeholder="e.g. Chapter 5, Article 5.2" />
      </Field>
      <div className="flex flex-wrap gap-6 text-sm text-neutral-700">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="requireVerification" value="true" defaultChecked className="h-4 w-4 rounded border-neutral-400" />
          Require identity verification
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="stateMatch" value="true" className="h-4 w-4 rounded border-neutral-400" />
          Restrict to member&apos;s state
        </label>
      </div>
      <div className="flex gap-3">
        <button type="submit" disabled={busy} className={btnPrimary}>
          {busy ? "Creating…" : "Create Position"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className={btnSecondary}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export function PositionEditForm({ position }: { position: PositionRow }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const fd = new FormData(e.currentTarget);
    const responsibilities = String(fd.get("responsibilities") ?? "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const eligibility = String(fd.get("eligibility") ?? "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const payload = {
      positionName: String(fd.get("positionName") ?? ""),
      rank: String(fd.get("rank") ?? "100"),
      wing: String(fd.get("wing") ?? ""),
      state: String(fd.get("state") ?? "") || null,
      description: String(fd.get("description") ?? ""),
      responsibilities,
      appointmentMethod: String(fd.get("appointmentMethod") ?? position.appointmentMethod),
      eligibility,
      termInfo: String(fd.get("termInfo") ?? ""),
      vacancies: String(fd.get("vacancies") ?? "1"),
      vacancyStatus: String(fd.get("vacancyStatus") ?? "open"),
      applicationDeadline: String(fd.get("applicationDeadline") ?? "") || null,
      constitutionalReference: String(fd.get("constitutionalReference") ?? "") || null,
    };
    try {
      const res = await fetch(`/api/admin/positions/${position.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "Update failed.");
        return;
      }
      setMessage("Position updated. Vacancy status: " + payload.vacancyStatus + ".");
      router.refresh();
    } catch {
      setMessage("Network error.");
    } finally {
      setBusy(false);
    }
  }

  const deadline = position.applicationDeadline
    ? new Date(position.applicationDeadline).toISOString().slice(0, 10)
    : "";

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {message ? <Alert kind="success">{message}</Alert> : null}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <Field label="Position Name" htmlFor={`ep-name-${position.id}`}>
            <TextInput id={`ep-name-${position.id}`} name="positionName" defaultValue={position.positionName} />
          </Field>
        </div>
        <Field label="Rank" htmlFor={`ep-rank-${position.id}`}>
          <TextInput id={`ep-rank-${position.id}`} name="rank" type="number" defaultValue={position.rank} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Wing" htmlFor={`ep-wing-${position.id}`}>
          <TextInput id={`ep-wing-${position.id}`} name="wing" defaultValue={position.wing} />
        </Field>
        <Field label="State (if specific)" htmlFor={`ep-state-${position.id}`}>
          <TextInput id={`ep-state-${position.id}`} name="state" defaultValue={position.state ?? ""} />
        </Field>
      </div>
      <Field label="Description" htmlFor={`ep-desc-${position.id}`}>
        <TextArea id={`ep-desc-${position.id}`} name="description" rows={2} defaultValue={position.description ?? ""} />
      </Field>
      <Field label="Responsibilities (one per line)" htmlFor={`ep-resp-${position.id}`}>
        <TextArea id={`ep-resp-${position.id}`} name="responsibilities" rows={4} defaultValue={(position.responsibilities ?? []).join("\n")} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Appointment Method" htmlFor={`ep-method-${position.id}`}>
          <Select id={`ep-method-${position.id}`} name="appointmentMethod" defaultValue={position.appointmentMethod}>
            {Object.entries(METHOD_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
        </Field>
        <Field label="Term Information" htmlFor={`ep-term-${position.id}`}>
          <TextInput id={`ep-term-${position.id}`} name="termInfo" defaultValue={position.termInfo ?? ""} />
        </Field>
      </div>
      <Field label="Eligibility (one per line)" htmlFor={`ep-elig-${position.id}`}>
        <TextArea id={`ep-elig-${position.id}`} name="eligibility" rows={3} defaultValue={(position.eligibility ?? []).join("\n")} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Vacancies" htmlFor={`ep-vac-${position.id}`}>
          <TextInput id={`ep-vac-${position.id}`} name="vacancies" type="number" defaultValue={position.vacancies} />
        </Field>
        <Field label="Vacancy Status" htmlFor={`ep-vs-${position.id}`}>
          <Select id={`ep-vs-${position.id}`} name="vacancyStatus" defaultValue={position.vacancyStatus}>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </Select>
        </Field>
        <Field label="Deadline" htmlFor={`ep-dl-${position.id}`}>
          <TextInput id={`ep-dl-${position.id}`} name="applicationDeadline" type="date" defaultValue={deadline} />
        </Field>
      </div>
      <Field label="Constitutional Reference" htmlFor={`ep-ref-${position.id}`}>
        <TextInput id={`ep-ref-${position.id}`} name="constitutionalReference" defaultValue={position.constitutionalReference ?? ""} />
      </Field>
      <button type="submit" disabled={busy} className={btnPrimary}>
        {busy ? "Saving…" : "Save Changes"}
      </button>
    </form>
  );
}
