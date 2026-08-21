import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/session";
import { db } from "@/db";
import {
  applications,
  members,
  positions,
  applicationEvents,
  appointments,
} from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { Card, StatusBadge, KV, MethodBadge, LevelBadge, Alert } from "@/components/ui";
import {
  STATUS_LABELS,
  LEVEL_LABELS,
  ROLE_LABELS,
  VERIFICATION_LABELS,
  formatDateTime,
} from "@/lib/constants";
import type { ApplicationStatus } from "@/db/schema";
import { TransitionButtons, NoteForm, AppointmentForm } from "@/components/application-actions";
import { APPOINTMENT_ROLES, type Role } from "@/db/schema";

export const metadata: Metadata = { title: "Application Review" };
export const dynamic = "force-dynamic";

export default async function AdminApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await requireAdmin();
  const { id } = await params;
  const appId = Number(id);
  if (!Number.isInteger(appId)) notFound();

  const rows = await db
    .select({
      application: applications,
      member: members,
      position: positions,
    })
    .from(applications)
    .innerJoin(members, eq(members.id, applications.memberId))
    .innerJoin(positions, eq(positions.id, applications.positionId))
    .where(eq(applications.id, appId))
    .limit(1);

  const row = rows[0];
  if (!row) notFound();
  const { application, member, position } = row;

  const events = await db
    .select()
    .from(applicationEvents)
    .where(eq(applicationEvents.applicationId, application.id))
    .orderBy(asc(applicationEvents.createdAt));

  const appointmentRows = await db
    .select()
    .from(appointments)
    .where(eq(appointments.applicationId, application.id))
    .limit(1);
  const existingAppointment = appointmentRows[0] ?? null;

  // Appointment authorities available for selection
  const authorityRows = await db
    .select({ id: members.id, name: members.name, role: members.role })
    .from(members)
    .where(eq(members.membershipStatus, "active"));
  const authorities = authorityRows
    .filter((a) => APPOINTMENT_ROLES.includes(a.role as Role))
    .map((a) => ({
      id: a.id,
      name: a.name,
      role: a.role,
      label: `${a.name} — ${ROLE_LABELS[a.role] ?? a.role}`,
    }));

  const canAppoint = APPOINTMENT_ROLES.includes(admin.role as Role);
  const answers = application.answers ?? {};
  const notes = application.internalNotes ?? [];

  return (
    <main className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/admin/applications"
            className="text-sm font-semibold text-neutral-500 underline underline-offset-2 hover:text-neutral-900"
          >
            ← Back to Applications
          </Link>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-neutral-900">
            {application.applicationId}
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            {member.name} ({member.memberId}) → {position.positionName}
          </p>
        </div>
        <StatusBadge status={application.status} />
      </div>

      <div className="flex flex-wrap gap-2">
        <LevelBadge level={position.level} />
        <MethodBadge method={position.appointmentMethod} />
        {application.status === "selected" && !existingAppointment ? (
          <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-semibold text-white">
            Awaiting appointment
          </span>
        ) : null}
      </div>

      {existingAppointment ? (
        <Alert kind="success">
          <p className="font-semibold">Appointment recorded</p>
          <p className="mt-1">
            Reference <span className="font-mono font-semibold">{existingAppointment.referenceNumber}</span>{" "}
            · Appointing authority: {existingAppointment.appointingAuthority} · Effective{" "}
            {formatDateTime(existingAppointment.effectiveDate)}. Official email logged as{" "}
            {existingAppointment.officialEmailId ? "sent" : "pending"}.
          </p>
          <Link
            href="/admin/appointments"
            className="mt-2 inline-block text-xs font-semibold underline underline-offset-2"
          >
            View in Appointment Management →
          </Link>
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {/* Review actions */}
          <Card className="p-6">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-neutral-500">
              Review Workflow
            </h2>
            <TransitionButtons
              applicationId={application.id}
              status={application.status}
              canAppoint={canAppoint}
            />
          </Card>

          {application.status === "selected" && !existingAppointment ? (
            <AppointmentForm
              applicationId={application.id}
              positionName={position.positionName}
              method={position.appointmentMethod}
              authorities={authorities}
              canAppoint={canAppoint}
            />
          ) : null}

          {/* History */}
          <Card className="p-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-500">
              Status History
            </h2>
            <ol className="mt-5 space-y-0">
              {events.map((ev) => (
                <li key={ev.id} className="relative flex gap-4 pb-6 last:pb-0">
                  <span className="absolute left-[7px] top-5 h-full w-px bg-neutral-200" />
                  <span className="relative mt-1 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-neutral-900 bg-white" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-neutral-900">
                      {ev.toStatus
                        ? STATUS_LABELS[ev.toStatus as ApplicationStatus] ?? ev.toStatus
                        : "Started"}
                      {ev.fromStatus
                        ? ` ← ${STATUS_LABELS[ev.fromStatus as ApplicationStatus] ?? ev.fromStatus}`
                        : ""}
                    </p>
                    {ev.note ? (
                      <p className="mt-0.5 text-xs leading-relaxed text-neutral-600">{ev.note}</p>
                    ) : null}
                    <p className="mt-0.5 text-[11px] text-neutral-400">
                      {formatDateTime(ev.createdAt)} · {ev.actorName ?? "System"}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>

          {/* Answers */}
          <Card className="p-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-500">
              Application Answers
            </h2>
            <dl className="mt-4 space-y-4">
              <KV label="State / District" value={`${answers.state ?? "—"} / ${answers.district ?? "—"}`} />
              <KV label="Education" value={answers.education ?? "—"} />
              <KV label="Relevant Skills" value={answers.relevantSkills ?? "—"} />
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Professional Experience
                </dt>
                <dd className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-neutral-700">
                  {answers.professionalExperience ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Organizational Experience
                </dt>
                <dd className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-neutral-700">
                  {answers.organizationalExperience ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Leadership Experience
                </dt>
                <dd className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-neutral-700">
                  {answers.leadershipExperience ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Why this position?
                </dt>
                <dd className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-neutral-700">
                  {answers.motivation ?? "—"}
                </dd>
              </div>
            </dl>
          </Card>

          {/* Internal notes */}
          <Card className="p-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-500">
              Internal Notes ({notes.length})
            </h2>
            <div className="mt-4 space-y-3">
              {notes.map((n, i) => (
                <div key={i} className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3">
                  <p className="text-sm leading-relaxed text-neutral-700">{n.note}</p>
                  <p className="mt-1 text-[11px] text-neutral-400">
                    {n.adminName} · {formatDateTime(n.createdAt)}
                  </p>
                </div>
              ))}
              {notes.length === 0 ? (
                <p className="text-sm text-neutral-400">No internal notes yet.</p>
              ) : null}
            </div>
            <div className="mt-5 border-t border-neutral-100 pt-5">
              <NoteForm applicationId={application.id} />
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-500">
              Member
            </h2>
            <div className="mt-3 flex items-center gap-3">
              {member.photoDocumentId ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/api/files/${member.photoDocumentId}`}
                  alt=""
                  className="h-12 w-12 rounded-full border border-neutral-200 object-cover"
                />
              ) : (
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-900 text-sm font-bold text-white">
                  {member.name.slice(0, 1).toUpperCase()}
                </span>
              )}
              <div>
                <Link
                  href={`/admin/members/${member.id}`}
                  className="text-sm font-bold text-neutral-900 underline underline-offset-2"
                >
                  {member.name}
                </Link>
                <p className="font-mono text-xs text-neutral-500">{member.memberId}</p>
              </div>
            </div>
            <dl className="mt-4 space-y-3 border-t border-neutral-100 pt-4">
              <KV label="Email" value={member.email} />
              <KV label="Phone" value={member.phone ?? "—"} />
              <KV label="State" value={member.state ?? "—"} />
              <KV label="District" value={member.district ?? "—"} />
              <KV label="Verification" value={VERIFICATION_LABELS[member.verificationStatus] ?? member.verificationStatus} />
              <KV label="Membership" value={member.membershipStatus === "active" ? "Active" : "Suspended"} />
            </dl>
            {member.idDocumentId ? (
              <a
                href={`/api/files/${member.idDocumentId}`}
                target="_blank"
                className="mt-4 inline-flex w-full items-center justify-center rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
              >
                Review Identity Document →
              </a>
            ) : null}
          </Card>

          <Card className="p-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-500">
              Position
            </h2>
            <dl className="mt-4 space-y-3">
              <KV label="Position" value={position.positionName} />
              <KV label="Level" value={LEVEL_LABELS[position.level] ?? position.level} />
              <KV label="Wing" value={position.wing} />
              <KV label="Vacancies" value={String(position.vacancies)} />
              <KV label="Deadline" value={formatDateTime(position.applicationDeadline)} />
            </dl>
            <Link
              href={`/positions/${position.id}`}
              className="mt-4 inline-block text-xs font-semibold text-neutral-600 underline underline-offset-2"
            >
              View position →
            </Link>
          </Card>

          <Card className="p-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-500">
              Supporting Documents
            </h2>
            {(application.documents ?? []).length === 0 ? (
              <p className="mt-2 text-sm text-neutral-400">None uploaded.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {(application.documents ?? []).map((d, i) => (
                  <li key={i}>
                    <a
                      href={`/api/files/${d.documentId}`}
                      target="_blank"
                      className="text-sm font-medium text-neutral-800 underline decoration-neutral-300 underline-offset-2 hover:decoration-neutral-900"
                    >
                      {d.name}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </main>
  );
}
