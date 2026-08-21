import type { Metadata } from "next";
import Link from "next/link";
import { requireMember } from "@/lib/session";
import { db } from "@/db";
import {
  applications,
  appointments,
  positions,
  notifications,
} from "@/db/schema";
import { eq, and, desc, sql, isNotNull } from "drizzle-orm";
import { StatCard, Card, StatusBadge, EmptyState, btnPrimary } from "@/components/ui";
import {
  MEMBERSHIP_LABELS,
  VERIFICATION_LABELS,
  formatDateTime,
  STATUS_LABELS,
} from "@/lib/constants";
import type { ApplicationStatus } from "@/db/schema";

export const metadata: Metadata = { title: "Member Dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const member = await requireMember();

  // Current position (confirmed appointment)
  const currentRows = await db
    .select({
      positionName: positions.positionName,
      effectiveDate: appointments.effectiveDate,
      referenceNumber: appointments.referenceNumber,
    })
    .from(appointments)
    .innerJoin(positions, eq(positions.id, appointments.positionId))
    .where(
      and(
        eq(appointments.memberId, member.id),
        sql`${appointments.appointmentStatus} != 'revoked'`
      )
    )
    .orderBy(desc(appointments.effectiveDate))
    .limit(1);

  const currentPosition = currentRows[0] ?? null;

  const appRows = await db
    .select({
      applicationId: applications.applicationId,
      id: applications.id,
      status: applications.status,
      submittedAt: applications.submittedAt,
      positionName: positions.positionName,
      level: positions.level,
    })
    .from(applications)
    .innerJoin(positions, eq(positions.id, applications.positionId))
    .where(eq(applications.memberId, member.id))
    .orderBy(desc(applications.submittedAt));

  const latestApp = appRows[0] ?? null;

  const notifRows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.memberId, member.id))
    .orderBy(desc(notifications.createdAt))
    .limit(5);

  const stats = {
    total: appRows.length,
    active: appRows.filter((a) => !["rejected", "withdrawn"].includes(a.status)).length,
    selected: appRows.filter((a) => a.status === "selected").length,
    appointed: appRows.filter((a) => a.status === "appointed").length,
  };

  return (
    <main>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
          Welcome, {member.name.split(" ")[0]}
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          {member.memberId} · Member since {formatDateTime(member.createdAt).split(",")[0]}
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Member ID" value={<span className="font-mono text-lg">{member.memberId}</span>} />
        <StatCard
          label="Membership Status"
          value={MEMBERSHIP_LABELS[member.membershipStatus] ?? member.membershipStatus}
          sub={VERIFICATION_LABELS[member.verificationStatus] ?? member.verificationStatus}
        />
        <StatCard
          label="Current Position"
          value={currentPosition ? currentPosition.positionName : "None"}
          sub={currentPosition ? `Ref ${currentPosition.referenceNumber}` : "Apply for a position"}
        />
        <StatCard
          label="Applications"
          value={stats.total}
          sub={`${stats.active} active · ${stats.appointed} appointed`}
        />
        <StatCard label="State" value={member.state ?? "—"} sub={member.district ?? ""} />
        <StatCard label="District" value={member.district ?? "—"} sub={member.constituency ?? ""} />
        <StatCard
          label="Application Status"
          value={latestApp ? (STATUS_LABELS[latestApp.status as ApplicationStatus] ?? latestApp.status) : "No applications"}
          sub={latestApp ? latestApp.positionName : "Browse open positions"}
        />
        <StatCard
          label="Notifications"
          value={
            (await db
              .select({ count: sql<number>`count(*)::int` })
              .from(notifications)
              .where(and(eq(notifications.memberId, member.id), eq(notifications.read, false)))
              .then((r) => r[0]?.count ?? 0))
          }
          sub="unread"
        />
      </div>

      {/* Email verification banner */}
      {!member.emailVerified ? (
        <div className="mt-6 rounded-xl border border-amber-300 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          <p className="font-semibold">Action needed — verify your email</p>
          <p className="mt-1">
            Your email address has not been verified yet.{" "}
            <Link
              href="/verify-email?token=resend"
              className="font-semibold underline underline-offset-2"
            >
              Request a verification link
            </Link>
            .
          </p>
        </div>
      ) : null}

      {member.verificationStatus === "pending" ? (
        <div className="mt-6 rounded-xl border border-neutral-300 bg-neutral-100 px-5 py-4 text-sm text-neutral-700">
          <p className="font-semibold">Identity verification pending</p>
          <p className="mt-1">
            Your identity documents are awaiting administrator verification. You can
            browse positions, but eligibility checks may require a verified identity.
          </p>
        </div>
      ) : null}

      {/* Recent applications */}
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight text-neutral-900">
            My Applications
          </h2>
          <Link
            href="/dashboard/applications"
            className="text-sm font-semibold text-neutral-600 underline underline-offset-2 hover:text-neutral-900"
          >
            View all
          </Link>
        </div>
        {appRows.length === 0 ? (
          <EmptyState
            title="No applications yet"
            message="Browse the positions directory and apply for a position you are eligible for."
            action={
              <Link href="/positions" className={btnPrimary}>
                View Available Positions
              </Link>
            }
          />
        ) : (
          <Card className="divide-y divide-neutral-100">
            {appRows.slice(0, 5).map((a) => (
              <Link
                key={a.id}
                href={`/dashboard/applications/${a.id}`}
                className="flex items-center justify-between gap-3 px-5 py-4 transition hover:bg-neutral-50"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-neutral-900">
                    {a.positionName}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {a.applicationId} · {formatDateTime(a.submittedAt)}
                  </p>
                </div>
                <StatusBadge status={a.status} />
              </Link>
            ))}
          </Card>
        )}
      </div>

      {/* Recent notifications */}
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight text-neutral-900">
            Recent Notifications
          </h2>
          <Link
            href="/dashboard/notifications"
            className="text-sm font-semibold text-neutral-600 underline underline-offset-2 hover:text-neutral-900"
          >
            View all
          </Link>
        </div>
        {notifRows.length === 0 ? (
          <Card className="p-6 text-center text-sm text-neutral-500">
            No notifications yet.
          </Card>
        ) : (
          <Card className="divide-y divide-neutral-100">
            {notifRows.map((n) => (
              <div key={n.id} className="flex items-start justify-between gap-3 px-5 py-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-neutral-900">{n.subject}</p>
                  <p className="mt-0.5 line-clamp-1 text-xs text-neutral-500">{n.message}</p>
                  <p className="mt-1 text-[11px] text-neutral-400">{formatDateTime(n.createdAt)}</p>
                </div>
                {!n.read ? (
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-neutral-900" />
                ) : null}
              </div>
            ))}
          </Card>
        )}
      </div>
    </main>
  );
}
