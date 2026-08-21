import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/session";
import { db } from "@/db";
import {
  members,
  positions,
  applications,
  appointments,
  auditLogs,
} from "@/db/schema";
import { sql, desc, eq } from "drizzle-orm";
import { StatCard, Card, StatusBadge, TableWrap, Th, Td } from "@/components/ui";
import { formatDateTime } from "@/lib/constants";

export const metadata: Metadata = { title: "Admin Overview" };
export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const admin = await requireAdmin();

  const [totalMembers, verifiedMembers, pendingRegistrations, totalApplications, underReview, selectedApps, appointedMembers, totalPositions, openPositions] =
    await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(members),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(members)
        .where(sql`verification_status = 'verified'`),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(members)
        .where(sql`verification_status = 'pending'`),
      db.select({ count: sql<number>`count(*)::int` }).from(applications),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(applications)
        .where(sql`status = 'under_review'`),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(applications)
        .where(sql`status = 'selected'`),
      db.select({ count: sql<number>`count(*)::int` }).from(appointments),
      db.select({ count: sql<number>`count(*)::int` }).from(positions),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(positions)
        .where(sql`vacancy_status = 'open'`),
      db.select({ count: sql<number>`count(*)::int` }).from(appointments),
    ]);

  const recentApplications = await db
    .select({
      id: applications.id,
      applicationId: applications.applicationId,
      status: applications.status,
      submittedAt: applications.submittedAt,
      memberName: members.name,
      memberId: members.memberId,
      positionName: positions.positionName,
    })
    .from(applications)
    .innerJoin(members, eq(members.id, applications.memberId))
    .innerJoin(positions, eq(positions.id, applications.positionId))
    .orderBy(desc(applications.submittedAt))
    .limit(6);

  const recentAudit = await db
    .select()
    .from(auditLogs)
    .orderBy(desc(auditLogs.createdAt))
    .limit(8);

  return (
    <main className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
          Administration Overview
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Signed in as {admin.name} ({admin.memberId}).
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Members" value={totalMembers[0]?.count ?? 0} />
        <StatCard label="Verified Members" value={verifiedMembers[0]?.count ?? 0} />
        <StatCard label="Pending Registrations" value={pendingRegistrations[0]?.count ?? 0} />
        <StatCard label="Position Applications" value={totalApplications[0]?.count ?? 0} />
        <StatCard label="Under Review" value={underReview[0]?.count ?? 0} />
        <StatCard label="Selected Applicants" value={selectedApps[0]?.count ?? 0} />
        <StatCard label="Appointed Members" value={appointedMembers[0]?.count ?? 0} />
        <StatCard
          label="Open Positions"
          value={`${openPositions[0]?.count ?? 0}/${totalPositions[0]?.count ?? 0}`}
        />
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight text-neutral-900">
            Recent Applications
          </h2>
          <Link
            href="/admin/applications"
            className="text-sm font-semibold text-neutral-600 underline underline-offset-2 hover:text-neutral-900"
          >
            Manage applications →
          </Link>
        </div>
        <TableWrap>
          <table className="w-full">
            <thead className="border-b border-neutral-200 bg-neutral-50">
              <tr>
                <Th>Application</Th>
                <Th>Member</Th>
                <Th>Position</Th>
                <Th>Status</Th>
                <Th>Submitted</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {recentApplications.map((a) => (
                <tr key={a.id} className="transition hover:bg-neutral-50">
                  <Td>
                    <Link
                      href={`/admin/applications/${a.id}`}
                      className="font-mono font-semibold text-neutral-900 underline underline-offset-2"
                    >
                      {a.applicationId}
                    </Link>
                  </Td>
                  <Td>
                    {a.memberName}
                    <span className="block text-xs text-neutral-400">{a.memberId}</span>
                  </Td>
                  <Td>{a.positionName}</Td>
                  <Td>
                    <StatusBadge status={a.status} />
                  </Td>
                  <Td className="text-neutral-500">{formatDateTime(a.submittedAt)}</Td>
                </tr>
              ))}
              {recentApplications.length === 0 ? (
                <tr>
                  <Td className="py-8 text-center text-neutral-400" >
                    No applications yet.
                  </Td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </TableWrap>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight text-neutral-900">
            Recent Audit Activity
          </h2>
          <Link
            href="/admin/audit"
            className="text-sm font-semibold text-neutral-600 underline underline-offset-2 hover:text-neutral-900"
          >
            Full audit log →
          </Link>
        </div>
        <Card className="divide-y divide-neutral-100">
          {recentAudit.map((log) => (
            <div key={log.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
              <p className="text-sm text-neutral-700">
                <span className="font-semibold text-neutral-900">
                  {log.adminName ?? "System"}
                </span>{" "}
                — {log.action.replaceAll("_", " ")}
                {log.targetId ? (
                  <span className="ml-1 font-mono text-xs text-neutral-400">
                    ({log.targetId})
                  </span>
                ) : null}
              </p>
              <p className="text-xs text-neutral-400">{formatDateTime(log.createdAt)}</p>
            </div>
          ))}
          {recentAudit.length === 0 ? (
            <p className="px-5 py-6 text-center text-sm text-neutral-400">
              No audit records yet.
            </p>
          ) : null}
        </Card>
      </div>
    </main>
  );
}
