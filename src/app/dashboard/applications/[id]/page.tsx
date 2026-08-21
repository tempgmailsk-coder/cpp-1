import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMember } from "@/lib/session";
import { db } from "@/db";
import {
  applications,
  positions,
  applicationEvents,
  appointments,
} from "@/db/schema";
import { eq, and, asc, desc } from "drizzle-orm";
import { Card, StatusBadge, KV, MethodBadge, LevelBadge, Alert } from "@/components/ui";
import { formatDateTime, STATUS_LABELS, LEVEL_LABELS } from "@/lib/constants";
import type { ApplicationStatus } from "@/db/schema";
import { WithdrawButton } from "@/components/withdraw-button";

export const metadata: Metadata = { title: "Application Details" };
export const dynamic = "force-dynamic";

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const member = await requireMember();
  const { id } = await params;
  const appId = Number(id);
  if (!Number.isInteger(appId)) notFound();

  const rows = await db
    .select({
      application: applications,
      position: positions,
    })
    .from(applications)
    .innerJoin(positions, eq(positions.id, applications.positionId))
    .where(and(eq(applications.id, appId), eq(applications.memberId, member.id)))
    .limit(1);

  const row = rows[0];
  if (!row) notFound();
  const { application, position } = row;

  const events = await db
    .select()
    .from(applicationEvents)
    .where(eq(applicationEvents.applicationId, application.id))
    .orderBy(asc(applicationEvents.createdAt));

  const appointmentRows = await db
    .select()
    .from(appointments)
    .where(eq(appointments.applicationId, application.id))
    .orderBy(desc(appointments.createdAt));
  const appointment = appointmentRows[0] ?? null;

  const answers = application.answers ?? {};
  const canWithdraw = ["submitted", "under_review", "verification", "shortlisted"].includes(
    application.status
  );

  return (
    <main className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/dashboard/applications"
            className="text-sm font-semibold text-neutral-500 underline underline-offset-2 hover:text-neutral-900"
          >
            ← Back to My Applications
          </Link>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-neutral-900">
            {position.positionName}
          </h1>
          <p className="mt-1 font-mono text-sm text-neutral-500">{application.applicationId}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={application.status} />
          {canWithdraw ? <WithdrawButton applicationId={application.id} /> : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <LevelBadge level={position.level} />
        <MethodBadge method={position.appointmentMethod} />
      </div>

      {appointment ? (
        <Alert kind="success">
          <p className="font-semibold">Official Appointment</p>
          <p className="mt-1">
            You were appointed to this position on {formatDateTime(appointment.appointmentDate)}{" "}
            by <strong>{appointment.appointingAuthority}</strong>, effective{" "}
            <strong>{formatDateTime(appointment.effectiveDate)}</strong>. Reference:{" "}
            <span className="font-mono font-semibold">{appointment.referenceNumber}</span>. An
            official appointment notification was sent to your registered email address.
          </p>
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* History */}
        <Card className="p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-500">
            Application History
          </h2>
          {events.length === 0 ? (
            <p className="mt-4 text-sm text-neutral-500">No history recorded.</p>
          ) : (
            <ol className="mt-5 space-y-0">
              {events.map((ev) => (
                <li key={ev.id} className="relative flex gap-4 pb-6 last:pb-0">
                  <span className="absolute left-[7px] top-5 h-full w-px bg-neutral-200 last:hidden" />
                  <span className="relative mt-1 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-neutral-900 bg-white" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-neutral-900">
                      {ev.toStatus
                        ? STATUS_LABELS[ev.toStatus as ApplicationStatus] ?? ev.toStatus
                        : "Started"}
                      {ev.fromStatus
                        ? ` (from ${STATUS_LABELS[ev.fromStatus as ApplicationStatus] ?? ev.fromStatus})`
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
          )}
        </Card>

        {/* Summary */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-500">
              Summary
            </h2>
            <dl className="mt-4 space-y-4">
              <KV label="Position" value={position.positionName} />
              <KV label="Level" value={LEVEL_LABELS[position.level] ?? position.level} />
              <KV label="Submitted" value={formatDateTime(application.submittedAt)} />
              <KV label="Last Review" value={formatDateTime(application.reviewedAt)} />
              <KV label="Decision" value={formatDateTime(application.decisionAt)} />
              <KV label="Deadline" value={formatDateTime(position.applicationDeadline)} />
            </dl>
          </Card>

          <Card className="p-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-500">
              Your Answers
            </h2>
            <dl className="mt-4 space-y-4">
              <KV label="State" value={answers.state ?? "—"} />
              <KV label="District" value={answers.district ?? "—"} />
              <KV label="Education" value={answers.education ?? "—"} />
              <KV label="Skills" value={answers.relevantSkills ?? "—"} />
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Motivation
                </dt>
                <dd className="mt-1 text-sm leading-relaxed text-neutral-700">
                  {answers.motivation ?? "—"}
                </dd>
              </div>
            </dl>
          </Card>

          {(application.documents ?? []).length > 0 ? (
            <Card className="p-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-500">
                Supporting Documents
              </h2>
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
            </Card>
          ) : null}
        </div>
      </div>
    </main>
  );
}
