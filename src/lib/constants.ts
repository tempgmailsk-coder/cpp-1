import type { ApplicationStatus, AppointmentMethod } from "@/db/schema";

export const ORG_NAME = "Common People's Party";
export const ORG_SHORT = "CPP";
export const TAGLINE =
  "Defined Responsibility • Limited Power • Continuous Public Accountability";
export const CONSTITUTION_TITLE =
  "Absolute Constitution of the Common People's Party (CPP)";
export const CONSTITUTION_VERSION = "Version 1.0";
export const CONSTITUTION_PDF_PATH = "/cpp-constitution.pdf";

export const APP_BASE_URL =
  process.env.APP_BASE_URL ?? "http://localhost:3000";

/* ------------------------------------------------------------------ */
/* Application statuses                                                */
/* ------------------------------------------------------------------ */
export const APPLICATION_STATUSES: ApplicationStatus[] = [
  "submitted",
  "under_review",
  "verification",
  "shortlisted",
  "selected",
  "appointed",
  "rejected",
  "withdrawn",
];

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  submitted: "Submitted",
  under_review: "Under Review",
  verification: "Verification",
  shortlisted: "Shortlisted",
  selected: "Selected",
  appointed: "Appointed",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export const STATUS_STYLES: Record<ApplicationStatus, string> = {
  submitted: "bg-neutral-100 text-neutral-700 ring-neutral-300",
  under_review: "bg-amber-50 text-amber-800 ring-amber-300",
  verification: "bg-sky-50 text-sky-800 ring-sky-300",
  shortlisted: "bg-violet-50 text-violet-800 ring-violet-300",
  selected: "bg-emerald-50 text-emerald-800 ring-emerald-300",
  appointed: "bg-black text-white ring-black",
  rejected: "bg-red-50 text-red-700 ring-red-300",
  withdrawn: "bg-neutral-100 text-neutral-500 ring-neutral-300",
};

/** Allowed transitions for the constitutional review workflow. */
export const STATUS_TRANSITIONS: Partial<
  Record<ApplicationStatus, ApplicationStatus[]>
> = {
  submitted: ["under_review", "rejected", "withdrawn"],
  under_review: ["verification", "shortlisted", "rejected", "withdrawn"],
  verification: ["under_review", "shortlisted", "rejected", "withdrawn"],
  shortlisted: ["selected", "under_review", "rejected", "withdrawn"],
  selected: ["appointed", "rejected"],
  appointed: [],
  rejected: [],
  withdrawn: [],
};

/* ------------------------------------------------------------------ */
/* Appointment methods (constitutional)                                */
/* ------------------------------------------------------------------ */
export const APPOINTMENT_METHODS: AppointmentMethod[] = [
  "election",
  "electoral_college",
  "appointment",
  "joint_appointment",
  "provisional_appointment",
  "committee_selection",
];

export const METHOD_LABELS: Record<AppointmentMethod, string> = {
  election: "Election",
  electoral_college: "Electoral College",
  appointment: "Appointment",
  joint_appointment: "Joint Appointment",
  provisional_appointment: "Provisional Appointment",
  committee_selection: "Committee Selection",
};

export const METHOD_DESCRIPTIONS: Record<AppointmentMethod, string> = {
  election:
    "The position is filled through a direct constitutional election process as specified in the Constitution.",
  electoral_college:
    "The position is filled through an electoral college constituted under the Constitution.",
  appointment:
    "The position is filled by appointment by the constitutional appointing authority.",
  joint_appointment:
    "The position is filled by joint appointment requiring consensus between the designated constitutional authorities, with the fallback mechanism specified in the Constitution.",
  provisional_appointment:
    "The position is filled through the provisional appointment provision of the Constitution, applicable where the prescribed electoral conditions do not yet exist.",
  committee_selection:
    "The position is filled through selection by the constitutional committee.",
};

export const LEVEL_LABELS: Record<string, string> = {
  national: "National Level",
  state: "State Level",
};

export const ROLE_LABELS: Record<string, string> = {
  member: "Member",
  state_admin: "State Administrator",
  national_admin: "National Administrator",
  appointment_authority: "Appointment Authority",
  super_admin: "Super Administrator",
};

export const VERIFICATION_LABELS: Record<string, string> = {
  pending: "Pending Verification",
  verified: "Verified",
  rejected: "Verification Rejected",
};

export const MEMBERSHIP_LABELS: Record<string, string> = {
  active: "Active",
  suspended: "Suspended",
};

export const NOTIFICATION_TYPES: Record<string, string> = {
  registration: "Registration",
  email_verified: "Email Verified",
  application_submitted: "Application Submitted",
  application_status: "Application Status",
  application_review: "Application Review",
  application_shortlisted: "Shortlisted",
  application_selected: "Selected",
  appointment: "Official Appointment",
  application_rejected: "Application Rejected",
  account: "Account",
  password_reset: "Password Reset",
  system: "System",
};

/* ------------------------------------------------------------------ */
/* Shared formatting helpers                                           */
/* ------------------------------------------------------------------ */
export function formatDate(value?: Date | string | null): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(value?: Date | string | null): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function titleCase(s: string): string {
  return s
    .split(/\s+/)
    .map((w) => (w ? w[0]!.toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(" ");
}

export function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!user || !domain) return email;
  return `${user.slice(0, 2)}***@${domain}`;
}

export function roleHome(role: string): string {
  const adminRoles = [
    "super_admin",
    "national_admin",
    "appointment_authority",
    "state_admin",
  ];
  return adminRoles.includes(role) ? "/admin" : "/dashboard";
}
