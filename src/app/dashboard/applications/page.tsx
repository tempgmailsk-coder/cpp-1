import type { Metadata } from "next";
import Link from "next/link";
import { requireMember } from "@/lib/session";
import { db } from "@/db";
import { applications, positions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Card, StatusBadge, EmptyState, btnPrimary, LevelBadge } from "@/components/ui";
import { formatDateTime } from "@/lib/constants";

export const metadata: Metadata = { title: "My Applications" };
export const dynamic = "force-dynamic";

export default async function MyApplicationsPage() {
  const member = await requireMember();

  const rows = await db
    .select({
      id: applications.id,
      applicationId: applications.applicationId,
      status: applications.status,
      submittedAt: applications.submittedAt,
      decisionAt: applications.decisionAt,
      positionName: positions.positionName,
      positionId: positions.id,
      level: positions.level,
    })
    .from(applications)
    .innerJoin(positions, eq(positions.id, applications.positionId))
    .where(eq(applications.memberId, member.id))
    .orderBy(desc(applications.submittedAt));

  return (
    <main>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            My Applications
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Track the status and history of your position applications.
          </p>
        </div>
        <Link href="/positions" className={btnPrimary}>
          Browse Positions
        </Link>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="No applications yet"
          message="When you apply for a constitutional position, your application and its full status history will appear here."
          action={
            <Link href="/positions" className={btnPrimary}>
              View Available Positions
            </Link>
          }
        />
      ) : (
        <Card className="divide-y divide-neutral-100">
          {rows.map((a) => (
            <Link
              key={a.id}
              href={`/dashboard/applications/${a.id}`}
              className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition hover:bg-neutral-50"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-bold text-neutral-900">{a.positionName}</p>
                  <LevelBadge level={a.level} />
                </div>
                <p className="mt-0.5 text-xs text-neutral-500">
                  <span className="font-mono">{a.applicationId}</span> · Submitted{" "}
                  {formatDateTime(a.submittedAt)}
                  {a.decisionAt ? ` · Decided ${formatDateTime(a.decisionAt)}` : ""}
                </p>
              </div>
              <StatusBadge status={a.status} />
            </Link>
          ))}
        </Card>
      )}
    </main>
  );
}
