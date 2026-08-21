import Link from "next/link";
import type { ReactNode } from "react";
import {
  STATUS_LABELS,
  STATUS_STYLES,
  METHOD_LABELS,
  LEVEL_LABELS,
} from "@/lib/constants";
import type { ApplicationStatus, AppointmentMethod } from "@/db/schema";

/* ------------------------------ Status badge ------------------------------ */
export function StatusBadge({ status }: { status: string }) {
  const key = (status in STATUS_STYLES ? status : "submitted") as ApplicationStatus;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${STATUS_STYLES[key]}`}
    >
      {STATUS_LABELS[key] ?? status}
    </span>
  );
}

export function MethodBadge({ method }: { method: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-neutral-300 bg-neutral-50 px-2.5 py-0.5 text-xs font-medium text-neutral-700">
      {METHOD_LABELS[method as AppointmentMethod] ?? method}
    </span>
  );
}

export function LevelBadge({ level }: { level: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-neutral-900 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-white">
      {LEVEL_LABELS[level] ?? level}
    </span>
  );
}

/* --------------------------------- Card ----------------------------------- */
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-neutral-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-neutral-500">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

/* ------------------------------- Form parts ------------------------------- */
const inputBase =
  "block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 shadow-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 disabled:bg-neutral-100 disabled:text-neutral-500";

export function Field({
  label,
  htmlFor,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1 block text-sm font-medium text-neutral-800"
      >
        {label} {required ? <span className="text-red-600">*</span> : null}
      </label>
      {children}
      {hint && !error ? (
        <p className="mt-1 text-xs text-neutral-500">{hint}</p>
      ) : null}
      {error ? <p className="mt-1 text-xs font-medium text-red-600">{error}</p> : null}
    </div>
  );
}

export function TextInput(
  props: React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }
) {
  const { invalid, className, ...rest } = props;
  return (
    <input
      {...rest}
      className={`${inputBase} ${invalid ? "border-red-400" : ""} ${className ?? ""}`}
    />
  );
}

export function TextArea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }
) {
  const { invalid, className, ...rest } = props;
  return (
    <textarea
      {...rest}
      className={`${inputBase} min-h-[96px] ${invalid ? "border-red-400" : ""} ${className ?? ""}`}
    />
  );
}

export function Select(
  props: React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }
) {
  const { invalid, className, ...rest } = props;
  return (
    <select
      {...rest}
      className={`${inputBase} ${invalid ? "border-red-400" : ""} ${className ?? ""}`}
    />
  );
}

/* -------------------------------- Buttons --------------------------------- */
export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 disabled:cursor-not-allowed disabled:opacity-50";

export const btnSecondary =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-800 shadow-sm transition hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 disabled:cursor-not-allowed disabled:opacity-50";

export const btnDanger =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50";

/* --------------------------------- Alerts --------------------------------- */
export function Alert({
  kind,
  children,
}: {
  kind: "info" | "success" | "error" | "warning";
  children: ReactNode;
}) {
  const styles = {
    info: "border-neutral-300 bg-neutral-50 text-neutral-800",
    success: "border-emerald-300 bg-emerald-50 text-emerald-900",
    error: "border-red-300 bg-red-50 text-red-900",
    warning: "border-amber-300 bg-amber-50 text-amber-900",
  } as const;
  return (
    <div
      role="alert"
      className={`rounded-lg border px-4 py-3 text-sm leading-relaxed ${styles[kind]}`}
    >
      {children}
    </div>
  );
}

export function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-white px-6 py-14 text-center">
      <p className="text-base font-semibold text-neutral-800">{title}</p>
      <p className="mt-1 max-w-md text-sm text-neutral-500">{message}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: ReactNode;
  sub?: string;
}) {
  return (
    <Card className="p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
        {label}
      </p>
      <p className="mt-2 truncate text-2xl font-bold tracking-tight text-neutral-900">
        {value}
      </p>
      {sub ? <p className="mt-1 text-xs text-neutral-500">{sub}</p> : null}
    </Card>
  );
}

export function TableWrap({ children }: { children: ReactNode }) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">{children}</div>
    </Card>
  );
}

export function Th({ children }: { children?: ReactNode }) {
  return (
    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
      {children}
    </th>
  );
}

export function Td({
  children,
  className = "",
}: {
  children?: ReactNode;
  className?: string;
}) {
  return <td className={`px-4 py-3 text-sm text-neutral-700 ${className}`}>{children}</td>;
}

export function KV({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
        {label}
      </dt>
      <dd className="text-sm font-medium text-neutral-900">{value}</dd>
    </div>
  );
}

export function PageShell({
  title,
  subtitle,
  children,
  action,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <SectionTitle title={title} subtitle={subtitle} action={action} />
      {children}
    </main>
  );
}

export function NavLink({
  href,
  children,
  active,
}: {
  href: string;
  children: ReactNode;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
        active
          ? "bg-neutral-900 text-white"
          : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
      }`}
    >
      {children}
    </Link>
  );
}
