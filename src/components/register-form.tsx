"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Alert, Field, TextInput, TextArea, Select, btnPrimary } from "@/components/ui";

const STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa",
  "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland",
  "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi",
  "Andaman and Nicobar Islands", "Chandigarh", "Jammu and Kashmir", "Ladakh",
  "Lakshadweep", "Puducherry",
];

export function RegisterForm() {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ memberId: string; demoVerifyLink: string | null } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [photoName, setPhotoName] = useState("");
  const [docName, setDocName] = useState("");
  const [consent, setConsent] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setFormError(null);

    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("consent", consent ? "true" : "false");

    try {
      const res = await fetch("/api/auth/register", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        if (data.fieldErrors) {
          const flat: Record<string, string> = {};
          for (const [k, v] of Object.entries(data.fieldErrors)) {
            const arr = v as string[];
            if (arr && arr.length > 0) flat[k] = arr[0]!;
          }
          setErrors(flat);
          setFormError(data.error ?? null);
        } else {
          setFormError(data.error ?? "Registration failed. Please try again.");
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      setSuccess(data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="mx-auto max-w-xl">
        <Alert kind="success">
          <p className="font-semibold">Registration received</p>
          <p className="mt-1">
            Welcome to the Common People&apos;s Party! Your <strong>Member ID</strong> is{" "}
            <strong className="whitespace-nowrap">{success.memberId}</strong>.
          </p>
        </Alert>
        {success.demoVerifyLink ? (
          <div className="mt-4 rounded-xl border border-neutral-200 bg-white p-5 text-sm">
            <p className="font-semibold text-neutral-900">Verify your email address</p>
            <p className="mt-1 leading-relaxed text-neutral-600">
              A verification email was recorded in the CPP email outbox. In this demo
              environment, open the link below to verify your account and continue to your
              dashboard:
            </p>
            <a
              href={success.demoVerifyLink}
              className="mt-3 inline-block break-all rounded-lg bg-neutral-100 px-3 py-2 text-xs font-medium text-neutral-800 underline decoration-neutral-400 underline-offset-2"
            >
              {success.demoVerifyLink}
            </a>
          </div>
        ) : (
          <p className="mt-4 text-sm text-neutral-600">
            We sent a verification email to your registered address. Click the link in the
            email to activate your member profile.
          </p>
        )}
        <div className="mt-6">
          <Link href="/login" className={btnPrimary}>
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {formError ? (
        <Alert kind="error">
          <span className="font-semibold">{formError}</span>
        </Alert>
      ) : null}

      <section className="space-y-4 rounded-xl border border-neutral-200 bg-white p-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-500">
          1 · Personal Information
        </h2>
        <Field label="Full Name" htmlFor="name" required error={errors.name}>
          <TextInput id="name" name="name" placeholder="As per your identity document" maxLength={120} invalid={!!errors.name} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Date of Birth" htmlFor="dateOfBirth" required error={errors.dateOfBirth}>
            <TextInput id="dateOfBirth" name="dateOfBirth" type="date" max="2008-12-31" invalid={!!errors.dateOfBirth} />
          </Field>
          <Field label="Gender" htmlFor="gender" required error={errors.gender}>
            <Select id="gender" name="gender" defaultValue="" invalid={!!errors.gender}>
              <option value="" disabled>Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </Select>
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email Address" htmlFor="email" required error={errors.email}>
            <TextInput id="email" name="email" type="email" placeholder="you@example.com" invalid={!!errors.email} />
          </Field>
          <Field label="Mobile Number" htmlFor="phone" required error={errors.phone}>
            <TextInput id="phone" name="phone" type="tel" placeholder="+91 98765 43210" invalid={!!errors.phone} />
          </Field>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-neutral-200 bg-white p-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-500">
          2 · Location
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="State" htmlFor="state" required error={errors.state}>
            <Select id="state" name="state" defaultValue="" invalid={!!errors.state}>
              <option value="" disabled>Select state</option>
              {STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          </Field>
          <Field label="District" htmlFor="district" required error={errors.district}>
            <TextInput id="district" name="district" invalid={!!errors.district} />
          </Field>
          <Field label="Constituency" htmlFor="constituency" required error={errors.constituency}>
            <TextInput id="constituency" name="constituency" invalid={!!errors.constituency} />
          </Field>
        </div>
        <Field label="Address" htmlFor="address" required error={errors.address}>
          <TextArea id="address" name="address" rows={2} placeholder="House, street, city, PIN" invalid={!!errors.address} />
        </Field>
      </section>

      <section className="space-y-4 rounded-xl border border-neutral-200 bg-white p-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-500">
          3 · Background
        </h2>
        <Field label="Educational Qualification" htmlFor="education" required error={errors.education}>
          <TextInput id="education" name="education" placeholder="e.g. B.A. (Political Science)" invalid={!!errors.education} />
        </Field>
        <Field label="Profession" htmlFor="profession" required error={errors.profession}>
          <TextInput id="profession" name="profession" invalid={!!errors.profession} />
        </Field>
        <Field label="Skills" htmlFor="skills" required error={errors.skills} hint="Separate skills with commas.">
          <TextInput id="skills" name="skills" placeholder="e.g. community organizing, finance, digital media" invalid={!!errors.skills} />
        </Field>
        <Field label="Previous Organizational Experience" htmlFor="previousExperience" error={errors.previousExperience}>
          <TextArea id="previousExperience" name="previousExperience" rows={3} placeholder="Parties, unions, cooperatives, associations…" invalid={!!errors.previousExperience} />
        </Field>
      </section>

      <section className="space-y-4 rounded-xl border border-neutral-200 bg-white p-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-500">
          4 · Documents
        </h2>
        <p className="text-xs leading-relaxed text-neutral-500">
          Documents are stored securely and are never displayed publicly. Only authorized
          administrators can review them.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Profile Photo" htmlFor="photo" required error={errors.photo} hint={photoName || "JPG or PNG, up to 5 MB."}>
            <input
              id="photo"
              name="photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              required
              onChange={(e) => setPhotoName(e.target.files?.[0]?.name ?? "")}
              className="block w-full text-sm text-neutral-600 file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-neutral-700"
            />
          </Field>
          <Field label="Government / Identity Verification Document" htmlFor="idDocument" required error={errors.idDocument} hint={docName || "PDF, JPG or PNG, up to 10 MB."}>
            <input
              id="idDocument"
              name="idDocument"
              type="file"
              accept="application/pdf,image/jpeg,image/png"
              required
              onChange={(e) => setDocName(e.target.files?.[0]?.name ?? "")}
              className="block w-full text-sm text-neutral-600 file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-neutral-700"
            />
          </Field>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-neutral-200 bg-white p-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-500">
          5 · Account Security
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Password" htmlFor="password" required error={errors.password} hint="At least 8 characters with letters and numbers.">
            <TextInput id="password" name="password" type="password" autoComplete="new-password" invalid={!!errors.password} />
          </Field>
          <Field label="Confirm Password" htmlFor="confirmPassword" required error={errors.confirmPassword}>
            <TextInput id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" invalid={!!errors.confirmPassword} />
          </Field>
        </div>
      </section>

      <section className="rounded-xl border border-neutral-300 bg-neutral-100 p-5">
        <label className="flex items-start gap-3 text-sm leading-relaxed text-neutral-700">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-neutral-400 text-neutral-900 focus:ring-neutral-900"
          />
          <span>
            I confirm that the information provided by me is accurate and that I agree to
            follow the <Link href="/constitution" className="font-semibold underline decoration-neutral-400 underline-offset-2">CPP Constitution</Link> and internal rules.{" "}
            <span className="text-red-600">*</span>
          </span>
        </label>
        {errors.consent ? (
          <p className="mt-2 text-xs font-medium text-red-600">{errors.consent}</p>
        ) : null}
      </section>

      <button type="submit" disabled={submitting} className={`${btnPrimary} w-full py-3`}>
        {submitting ? "Submitting…" : "Create My Membership"}
      </button>
      <p className="text-center text-sm text-neutral-500">
        Already a member?{" "}
        <Link href="/login" className="font-semibold text-neutral-900 underline underline-offset-2">
          Sign in
        </Link>
      </p>
    </form>
  );
}
