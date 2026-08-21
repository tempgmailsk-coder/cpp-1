"use client";

import { useState } from "react";
import { Alert, Field, TextInput, TextArea, Select, btnPrimary, btnSecondary } from "@/components/ui";

export interface ProfileData {
  phone: string;
  state: string;
  district: string;
  constituency: string;
  address: string;
  education: string;
  profession: string;
  skills: string;
  previousExperience: string;
  otpEnabled: boolean;
}

const STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa",
  "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland",
  "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi",
  "Andaman and Nicobar Islands", "Chandigarh", "Jammu and Kashmir", "Ladakh",
  "Lakshadweep", "Puducherry",
];

export function ProfileForm({ data }: { data: ProfileData }) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [otpEnabled, setOtpEnabled] = useState(data.otpEnabled);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    setMessage(null);
    const fd = new FormData(e.currentTarget);
    const payload: Record<string, unknown> = {
      otpEnabled,
    };
    for (const key of [
      "phone", "state", "district", "constituency", "address",
      "education", "profession", "skills", "previousExperience",
    ]) {
      payload[key] = String(fd.get(key) ?? "");
    }
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) {
        if (result.fieldErrors) {
          const flat: Record<string, string> = {};
          for (const [k, v] of Object.entries(result.fieldErrors)) {
            const arr = v as string[];
            if (arr && arr.length > 0) flat[k] = arr[0]!;
          }
          setErrors(flat);
        } else {
          setMessage(result.error ?? "Update failed.");
        }
        return;
      }
      setMessage("Profile updated successfully.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setMessage("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-neutral-200 bg-white p-6">
      {message ? (
        <Alert kind={message.toLowerCase().includes("success") ? "success" : "error"}>
          {message}
        </Alert>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Mobile Number" htmlFor="phone" required error={errors.phone}>
          <TextInput id="phone" name="phone" defaultValue={data.phone} invalid={!!errors.phone} />
        </Field>
        <Field label="State" htmlFor="state" required error={errors.state}>
          <Select id="state" name="state" defaultValue={data.state} invalid={!!errors.state}>
            <option value="" disabled>Select state</option>
            {STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        </Field>
        <Field label="District" htmlFor="district" required error={errors.district}>
          <TextInput id="district" name="district" defaultValue={data.district} invalid={!!errors.district} />
        </Field>
        <Field label="Constituency" htmlFor="constituency" required error={errors.constituency}>
          <TextInput id="constituency" name="constituency" defaultValue={data.constituency} invalid={!!errors.constituency} />
        </Field>
      </div>
      <Field label="Address" htmlFor="address" required error={errors.address}>
        <TextArea id="address" name="address" rows={2} defaultValue={data.address} invalid={!!errors.address} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Educational Qualification" htmlFor="education" required error={errors.education}>
          <TextInput id="education" name="education" defaultValue={data.education} invalid={!!errors.education} />
        </Field>
        <Field label="Profession" htmlFor="profession" required error={errors.profession}>
          <TextInput id="profession" name="profession" defaultValue={data.profession} invalid={!!errors.profession} />
        </Field>
      </div>
      <Field label="Skills" htmlFor="skills" required error={errors.skills}>
        <TextInput id="skills" name="skills" defaultValue={data.skills} invalid={!!errors.skills} />
      </Field>
      <Field label="Previous Organizational Experience" htmlFor="previousExperience" error={errors.previousExperience}>
        <TextArea id="previousExperience" name="previousExperience" rows={3} defaultValue={data.previousExperience} invalid={!!errors.previousExperience} />
      </Field>

      <label className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
        <input
          type="checkbox"
          checked={otpEnabled}
          onChange={(e) => setOtpEnabled(e.target.checked)}
          className="h-4 w-4 rounded border-neutral-400 text-neutral-900 focus:ring-neutral-900"
        />
        Enable OTP verification at sign-in (a 6-digit code will be emailed each login)
      </label>

      <button type="submit" disabled={busy} className={btnPrimary}>
        {busy ? "Saving…" : "Save Profile"}
      </button>
    </form>
  );
}

export function ChangePasswordForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: String(fd.get("currentPassword") ?? ""),
          password: String(fd.get("password") ?? ""),
          confirmPassword: String(fd.get("confirmPassword") ?? ""),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Password change failed.");
        return;
      }
      setMessage("Password changed successfully.");
      e.currentTarget.reset();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-neutral-200 bg-white p-6">
      {message ? <Alert kind="success">{message}</Alert> : null}
      {error ? <Alert kind="error">{error}</Alert> : null}
      <Field label="Current Password" htmlFor="currentPassword" required>
        <TextInput id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="New Password" htmlFor="password" required>
          <TextInput id="password" name="password" type="password" autoComplete="new-password" />
        </Field>
        <Field label="Confirm New Password" htmlFor="confirmPassword" required>
          <TextInput id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" />
        </Field>
      </div>
      <button type="submit" disabled={busy} className={btnSecondary}>
        {busy ? "Changing…" : "Change Password"}
      </button>
    </form>
  );
}
