import type { Metadata } from "next";
import { requireAdmin } from "@/lib/session";
import { db } from "@/db";
import { applications, members, positions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import {
  ApplicationsAdminTable,
  type AdminApplicationItem,
} from "@/components/applications-admin";

export const metadata: Metadata = { title: "Application Management" };
export const dynamic = "force-dynamic";

export default async function AdminApplicationsPage() {
  await requireAdmin();

  const rows = await db
    .select({
      id: applications.id,
      applicationId: applications.applicationId,
      status: applications.status,
      submittedAt: applications.submittedAt,
      memberName: members.name,
      memberId: members.memberId,
      memberState: members.state,
      positionName: positions.positionName,
      positionLevel: positions.level,
      positionId: positions.id,
    })
    .from(applications)
    .innerJoin(members, eq(members.id, applications.memberId))
    .innerJoin(positions, eq(positions.id, applications.positionId))
    .orderBy(desc(applications.submittedAt));

  const items: AdminApplicationItem[] = rows.map((r) => ({
    id: r.id,
    applicationId: r.applicationId,
    status: r.status,
    submittedAt: r.submittedAt.toISOString(),
    memberName: r.memberName,
    memberId: r.memberId,
    memberState: r.memberState,
    positionName: r.positionName,
    positionLevel: r.positionLevel,
    positionId: r.positionId,
  }));

  return (
    <main>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
          Application Management
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Review applications, move them through the review workflow, and record internal
          notes. Appointments are handled in Appointment Management.
        </p>
      </div>
      <ApplicationsAdminTable items={items} />
    </main>
  );
}
