import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/session";
import { db } from "@/db";
import { appointments, applications, members, positions } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { Card, TableWrap, Th, Td, StatusBadge, MethodBadge, btnPrimary, EmptyState } from "@/components/ui";
import { formatDateTime, formatDate, METHOD_LABELS, LEVEL_LABELS } from "@/lib/constants";
import { ResendAppointmentEmail } from "@/components/appointment-actions";
import { APPOINTMENT_ROLES, type Role } from "@/db/schema";
import type { AppointmentMethod } from "@/db/schema";

export const metadata: Metadata = { title: "Appointment Management" };
export const dynamic = "force-dynamic";

export default async function AdminAppointmentsPage() {
  const admin = await requireAdmin();
  const canResend = APPOINTMENT_ROLES.includes(admin.role as Role);

  const rows = await db
    .select({
      id: appointments.id,
      appointmentId: appointments.appointmentId,
      referenceNumber: appointments.referenceNumber,
      appointingAuthority: appointments.appointingAuthority,
      authorityRole: appointments.authorityRole,
      appointmentMethod: appointments.appointmentMethod,
      appointmentDate: appointments.appointmentDate,
      effectiveDate: appointments.effectiveDate,
      appointmentStatus: appointments.appointmentStatus,
      officialEmailId: appointments.officialEmailId,
      memberName: members.name,
      memberId: members.memberId,
      memberEmail: members.email,
      positionName: positions.positionName,
      positionLevel: positions.level,
      applicationId: applications.applicationId,
    })
    .from(appointments)
    .innerJoin(members, eq(members.id, appointments.memberId))
    .innerJoin(positions, eq(positions.id, appointments.positionId))
    .innerJoin(applications, eq(applications.id, appointments.applicationId))
    .orderBy(desc(appointments.createdAt));

  const selectedCount = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(applications)
    .where(sql`status = 'selected'`);

  return (
    <main className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Appointment Management
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Official appointment register. Confirm appointments, generate reference numbers,
            and send official email notifications to members.
          </p>
        </div>
        <Link href="/admin/applications" className={btnPrimary}>
          {selectedCount[0]?.count ?? 0} Selected Applications →
        </Link>
      </div>

      {!APPOINTMENT_ROLES.includes(admin.role as Role) ? (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          You are signed in as a <strong>State Administrator</strong>. Only the Super
          Administrator, National Administrators and authorized Appointment Authorities can
          confirm appointments and send official appointment emails.
        </div>
      ) : null}

      {rows.length === 0 ? (
        <EmptyState
          title="No appointments recorded yet"
          message="When an application is moved to Selected, you can confirm the appointment here — the system generates a reference number, stores the record, and emails the official notification."
          action={
            <Link href="/admin/applications" className={btnPrimary}>
              Review Applications
            </Link>
          }
        />
      ) : (
        <TableWrap>
          <table className="w-full">
            <thead className="border-b border-neutral-200 bg-neutral-50">
              <tr>
                <Th>Reference</Th>
                <Th>Member</Th>
                <Th>Position</Th>
                <Th>Method</Th>
                <Th>Appointing Authority</Th>
                <Th>Dates</Th>
                <Th>Official Email</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {rows.map((a) => (
                <tr key={a.id} className="align-top transition hover:bg-neutral-50">
                  <Td>
                    <span className="font-mono font-bold text-neutral-900">{a.referenceNumber}</span>
                    <span className="block font-mono text-xs text-neutral-400">{a.appointmentId}</span>
                    <span className="block text-xs text-neutral-500">App: {a.applicationId}</span>
                  </Td>
                  <Td>
                    <span className="font-semibold text-neutral-900">{a.memberName}</span>
                    <span className="block font-mono text-xs text-neutral-400">{a.memberId}</span>
                    <span className="block text-xs text-neutral-400">{a.memberEmail}</span>
                  </Td>
                  <Td>
                    {a.positionName}
                    <span className="block text-xs text-neutral-400">
                      {LEVEL_LABELS[a.positionLevel] ?? a.positionLevel}
                    </span>
                  </Td>
                  <Td>
                    <MethodBadge method={a.appointmentMethod} />
                  </Td>
                  <Td>
                    {a.appointingAuthority}
                    <span className="block text-xs text-neutral-400">{a.authorityRole ?? ""}</span>
                  </Td>
                  <Td className="text-xs">
                    <span className="block">Appointed: {formatDate(a.appointmentDate)}</span>
                    <span className="block">Effective: {formatDate(a.effectiveDate)}</span>
                  </Td>
                  <Td>
                    {a.officialEmailId ? (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-300">
                        Sent
                      </span>
                    ) : (
                      <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-500 ring-1 ring-inset ring-neutral-300">
                        Not sent
                      </span>
                    )}
                  </Td>
                  <Td>
                    <ResendAppointmentEmail
                      appointmentId={a.id}
                      canResend={canResend}
                    />
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      )}
    </main>
  );
}
