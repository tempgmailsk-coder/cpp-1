import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/session";
import { db } from "@/db";
import { members, applications, positions, appointments } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Card, KV, StatusBadge, TableWrap, Th, Td } from "@/components/ui";
import {
  VERIFICATION_LABELS,
  MEMBERSHIP_LABELS,
  ROLE_LABELS,
  formatDate,
  formatDateTime,
} from "@/lib/constants";
import { MemberDetailActions } from "@/components/member-detail-actions";

export const metadata: Metadata = { title: "Member Details" };
export const dynamic = "force-dynamic";

export default async function AdminMemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await requireAdmin();
  const { id } = await params;
  const memberId = Number(id);
  if (!Number.isInteger(memberId)) notFound();

  const rows = await db.select().from(members).where(eq(members.id, memberId)).limit(1);
  const member = rows[0];
  if (!member) notFound();

  const appRows = await db
    .select({
      id: applications.id,
      applicationId: applications.applicationId,
      status: applications.status,
      submittedAt: applications.submittedAt,
      positionName: positions.positionName,
    })
    .from(applications)
    .innerJoin(positions, eq(positions.id, applications.positionId))
    .where(eq(applications.memberId, member.id))
    .orderBy(desc(applications.submittedAt));

  const appointmentRows = await db
    .select({
      appointmentId: appointments.appointmentId,
      referenceNumber: appointments.referenceNumber,
      positionName: positions.positionName,
      appointingAuthority: appointments.appointingAuthority,
      effectiveDate: appointments.effectiveDate,
      appointmentStatus: appointments.appointmentStatus,
    })
    .from(appointments)
    .innerJoin(positions, eq(positions.id, appointments.positionId))
    .where(eq(appointments.memberId, member.id))
    .orderBy(desc(appointments.createdAt));

  const canManageRoles = admin.role === "super_admin" || admin.role === "national_admin";

  return (
    <main className="space-y-8">
      <div>
        <Link
          href="/admin/members"
          className="text-sm font-semibold text-neutral-500 underline underline-offset-2 hover:text-neutral-900"
        >
          ← Back to Members
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          {member.photoDocumentId ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/files/${member.photoDocumentId}`}
              alt=""
              className="h-16 w-16 rounded-full border-2 border-neutral-200 object-cover"
            />
          ) : (
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-900 text-xl font-bold text-white">
              {member.name.slice(0, 1).toUpperCase()}
            </span>
          )}
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">{member.name}</h1>
            <p className="font-mono text-sm text-neutral-500">{member.memberId}</p>
          </div>
        </div>
      </div>

      <MemberDetailActions
        memberId={member.id}
        verificationStatus={member.verificationStatus}
        membershipStatus={member.membershipStatus}
        role={member.role}
        canManageRoles={canManageRoles}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-500">
            Profile
          </h2>
          <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4">
            <KV label="Email" value={member.email} />
            <KV label="Phone" value={member.phone ?? "—"} />
            <KV label="Date of Birth" value={formatDate(member.dateOfBirth)} />
            <KV label="Gender" value={member.gender ? member.gender[0]!.toUpperCase() + member.gender.slice(1) : "—"} />
            <KV label="State" value={member.state ?? "—"} />
            <KV label="District" value={member.district ?? "—"} />
            <KV label="Constituency" value={member.constituency ?? "—"} />
            <KV label="Education" value={member.education ?? "—"} />
            <KV label="Profession" value={member.profession ?? "—"} />
            <KV label="Skills" value={member.skills ?? "—"} />
            <KV label="Role" value={ROLE_LABELS[member.role] ?? member.role} />
            <KV label="Verification" value={VERIFICATION_LABELS[member.verificationStatus] ?? member.verificationStatus} />
            <KV label="Membership" value={MEMBERSHIP_LABELS[member.membershipStatus] ?? member.membershipStatus} />
            <KV label="Email Verified" value={member.emailVerified ? "Yes" : "No"} />
            <KV label="Joined" value={formatDateTime(member.createdAt)} />
          </dl>
          <div className="mt-4 border-t border-neutral-100 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Address
            </p>
            <p className="mt-1 text-sm text-neutral-700">{member.address ?? "—"}</p>
          </div>
          <div className="mt-4 border-t border-neutral-100 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Previous Organizational Experience
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-neutral-700">
              {member.previousExperience ?? "—"}
            </p>
          </div>
          {member.suspendedReason ? (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
              <strong>Suspension reason:</strong> {member.suspendedReason}
            </p>
          ) : null}
        </Card>

        <Card className="p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-500">
            Verification Documents
          </h2>
          <p className="mt-1 text-xs text-neutral-500">
            Secure documents — never publicly displayed.
          </p>
          <div className="mt-4 space-y-3">
            <a
              href={`/api/files/${member.idDocumentId ?? ""}`}
              className={`flex items-center justify-between rounded-lg border border-neutral-200 px-4 py-3 text-sm font-semibold ${
                member.idDocumentId
                  ? "text-neutral-900 hover:bg-neutral-50"
                  : "pointer-events-none text-neutral-400"
              }`}
              target={member.idDocumentId ? "_blank" : undefined}
            >
              Government / Identity Document
              {member.idDocumentId ? <span className="text-xs font-medium text-neutral-500">Open →</span> : <span className="text-xs text-neutral-400">Not uploaded</span>}
            </a>
            <a
              href={`/api/files/${member.photoDocumentId ?? ""}`}
              className={`flex items-center justify-between rounded-lg border border-neutral-200 px-4 py-3 text-sm font-semibold ${
                member.photoDocumentId
                  ? "text-neutral-900 hover:bg-neutral-50"
                  : "pointer-events-none text-neutral-400"
              }`}
              target={member.photoDocumentId ? "_blank" : undefined}
            >
              Profile Photo
              {member.photoDocumentId ? <span className="text-xs font-medium text-neutral-500">Open →</span> : <span className="text-xs text-neutral-400">Not uploaded</span>}
            </a>
          </div>
        </Card>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-bold tracking-tight text-neutral-900">
          Applications ({appRows.length})
        </h2>
        <TableWrap>
          <table className="w-full">
            <thead className="border-b border-neutral-200 bg-neutral-50">
              <tr>
                <Th>Application</Th>
                <Th>Position</Th>
                <Th>Status</Th>
                <Th>Submitted</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {appRows.map((a) => (
                <tr key={a.id} className="transition hover:bg-neutral-50">
                  <Td>
                    <Link
                      href={`/admin/applications/${a.id}`}
                      className="font-mono font-semibold text-neutral-900 underline underline-offset-2"
                    >
                      {a.applicationId}
                    </Link>
                  </Td>
                  <Td>{a.positionName}</Td>
                  <Td>
                    <StatusBadge status={a.status} />
                  </Td>
                  <Td className="text-neutral-500">{formatDateTime(a.submittedAt)}</Td>
                </tr>
              ))}
              {appRows.length === 0 ? (
                <tr>
                  <Td className="py-8 text-center text-neutral-400" >No applications.</Td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </TableWrap>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-bold tracking-tight text-neutral-900">
          Appointments ({appointmentRows.length})
        </h2>
        <TableWrap>
          <table className="w-full">
            <thead className="border-b border-neutral-200 bg-neutral-50">
              <tr>
                <Th>Reference</Th>
                <Th>Position</Th>
                <Th>Appointing Authority</Th>
                <Th>Effective Date</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {appointmentRows.map((a) => (
                <tr key={a.appointmentId} className="transition hover:bg-neutral-50">
                  <Td className="font-mono font-semibold text-neutral-900">{a.referenceNumber}</Td>
                  <Td>{a.positionName}</Td>
                  <Td>{a.appointingAuthority}</Td>
                  <Td>{formatDate(a.effectiveDate)}</Td>
                  <Td>
                    <span className="rounded-full bg-black px-2 py-0.5 text-xs font-semibold text-white">
                      {a.appointmentStatus}
                    </span>
                  </Td>
                </tr>
              ))}
              {appointmentRows.length === 0 ? (
                <tr>
                  <Td className="py-8 text-center text-neutral-400" >No appointments.</Td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </TableWrap>
      </div>
    </main>
  );
}
