"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Alert,
  Field,
  TextInput,
  TextArea,
  btnPrimary,
  btnSecondary,
} from "@/components/ui";
import { formatDateTime } from "@/lib/constants";

export interface ApplyResult {
  ok: boolean;
  application?: {
    id: number;
    applicationId: string;
    positionName: string;
    submittedAt: string;
    status: string;
    statusLabel: string;
  };
  error?: string;
  reasons?: string[];
  fieldErrors?: Record<string, string[]>;
}

export function ApplyForm({
  positionId,
  positionName,
  member,
}: {
  positionId: number;
  positionName: string;
  member: {
    name: string;
    memberId: string;
    state: string;
    district: string;
    education: string;
    profession: string;
    skills: string;
    previousExperience: string | null;
  };
}) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [reasons, setReasons] = useState<string[] | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [declaration, setDeclaration] = useState(false);
  const [success, setSuccess] = useState<NonNullable<ApplyResult["application"]> | null>(null);
  const [docNames, setDocNames] = useState<string[]>([]);

  if (success) {
    return (
      <div className="space-y-5">
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-6 py-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h2 className="mt-4 text-xl font-bold text-emerald-950">
            Application Submitted Successfully
          </h2>
          <p className="mt-1 text-sm text-emerald-800">
            A confirmation email has been sent to your registered email address.
          </p>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <dl className="grid gap-4 sm:grid-cols-2">
            <Info label="Application ID" value={success.applicationId} mono />
            <Info label="Position" value={success.positionName} />
            <Info label="Date Submitted" value={formatDateTime(success.submittedAt)} />
            <Info
              label="Current Status"
              value={success.statusLabel}
            />
            <div className="sm:col-span-2">
              <Info label="Expected Review Stage" value="Administrator review → Verification → Shortlist → Selection" />
            </div>
          </dl>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard/applications" className={btnPrimary}>
            View My Applications
          </Link>
          <Link href="/positions" className={btnSecondary}>
            Browse More Positions
          </Link>
        </div>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setFormError(null);
    setReasons(null);

    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("positionId", String(positionId));
    fd.set("declaration", declaration ? "true" : "false");

    try {
      const res = await fetch("/api/applications", { method: "POST", body: fd });
      const data = (await res.json()) as ApplyResult;
      if (!res.ok) {
        if (data.reasons) setReasons(data.reasons);
        if (data.fieldErrors) {
          const flat: Record<string, string> = {};
          for (const [k, v] of Object.entries(data.fieldErrors)) {
            if (v && v.length > 0) flat[k] = v[0]!;
          }
          setErrors(flat);
        }
        setFormError(data.error ?? "Submission failed.");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      if (data.application) setSuccess(data.application);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {formError ? (
        <Alert kind="error">
          <p className="font-semibold">{formError}</p>
          {reasons && reasons.length > 0 ? (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
              {reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          ) : null}
        </Alert>
      ) : null}

      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-500">
          Applicant
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Applicant Name" htmlFor="applicantName">
            <TextInput id="applicantName" value={member.name} disabled />
          </Field>
          <Field label="Member ID" htmlFor="memberId">
            <TextInput id="memberId" value={member.memberId} disabled className="font-mono" />
          </Field>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Position Applied For" htmlFor="positionName">
            <TextInput id="positionName" value={positionName} disabled />
          </Field>
          <Field label="Education" htmlFor="education" required error={errors.education}>
            <TextInput id="education" name="education" defaultValue={member.education} invalid={!!errors.education} />
          </Field>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="State" htmlFor="state" required error={errors.state}>
            <TextInput id="state" name="state" defaultValue={member.state} invalid={!!errors.state} />
          </Field>
          <Field label="District" htmlFor="district" required error={errors.district}>
            <TextInput id="district" name="district" defaultValue={member.district} invalid={!!errors.district} />
          </Field>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-500">
          Experience
        </h2>
        <div className="mt-4 space-y-4">
          <Field label="Professional Experience" htmlFor="professionalExperience" required error={errors.professionalExperience}>
            <TextArea id="professionalExperience" name="professionalExperience" defaultValue={member.profession ? `Profession: ${member.profession}\n` : ""} invalid={!!errors.professionalExperience} />
          </Field>
          <Field label="Organizational Experience" htmlFor="organizationalExperience" required error={errors.organizationalExperience}>
            <TextArea id="organizationalExperience" name="organizationalExperience" defaultValue={member.previousExperience ?? ""} invalid={!!errors.organizationalExperience} />
          </Field>
          <Field label="Relevant Skills" htmlFor="relevantSkills" required error={errors.relevantSkills}>
            <TextInput id="relevantSkills" name="relevantSkills" defaultValue={member.skills} invalid={!!errors.relevantSkills} />
          </Field>
          <Field label="Leadership Experience" htmlFor="leadershipExperience" required error={errors.leadershipExperience}>
            <TextArea id="leadershipExperience" name="leadershipExperience" invalid={!!errors.leadershipExperience} />
          </Field>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-500">
          Motivation
        </h2>
        <div className="mt-4">
          <Field label="Why do you want this position?" htmlFor="motivation" required error={errors.motivation} hint="At least 20 characters.">
            <TextArea id="motivation" name="motivation" rows={4} invalid={!!errors.motivation} />
          </Field>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-500">
          Supporting Documents
        </h2>
        <p className="mt-1 text-xs text-neutral-500">
          Optional. PDF, JPG or PNG, up to 10 MB each, maximum 5 files.
        </p>
        <div className="mt-4">
          <input
            id="documents"
            name="documents"
            type="file"
            multiple
            accept="application/pdf,image/jpeg,image/png"
            onChange={(e) =>
              setDocNames(Array.from(e.target.files ?? []).map((f) => f.name))
            }
            className="block w-full text-sm text-neutral-600 file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-neutral-700"
          />
          {docNames.length > 0 ? (
            <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs text-neutral-500">
              {docNames.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      <div className="rounded-xl border border-neutral-300 bg-neutral-100 p-5">
        <label className="flex items-start gap-3 text-sm leading-relaxed text-neutral-700">
          <input
            type="checkbox"
            checked={declaration}
            onChange={(e) => setDeclaration(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-neutral-400 text-neutral-900 focus:ring-neutral-900"
          />
          <span>
            I declare that the information provided in this application is true and
            correct to the best of my knowledge, and I agree to abide by the CPP
            Constitution and internal rules. <span className="text-red-600">*</span>
          </span>
        </label>
        {errors.declaration ? (
          <p className="mt-2 text-xs font-medium text-red-600">{errors.declaration}</p>
        ) : null}
      </div>

      <button type="submit" disabled={submitting} className={`${btnPrimary} w-full py-3`}>
        {submitting ? "Submitting Application…" : "Submit Application"}
      </button>
    </form>
  );
}

function Info({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
        {label}
      </dt>
      <dd className={`mt-1 text-sm font-semibold text-neutral-900 ${mono ? "font-mono" : ""}`}>
        {value}
      </dd>
    </div>
  );
}
