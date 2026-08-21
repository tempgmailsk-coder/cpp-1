import type { Metadata } from "next";
import { requireAdmin } from "@/lib/session";
import { db } from "@/db";
import { positions, applications } from "@/db/schema";
import { asc, eq, sql } from "drizzle-orm";
import { Card, MethodBadge, LevelBadge, btnSecondary } from "@/components/ui";
import { PositionCreateForm, PositionEditForm } from "@/components/position-admin";
import { METHOD_LABELS, formatDate } from "@/lib/constants";
import type { AppointmentMethod } from "@/db/schema";

export const metadata: Metadata = { title: "Position Management" };
export const dynamic = "force-dynamic";

export default async function AdminPositionsPage() {
  await requireAdmin();

  const rows = await db
    .select()
    .from(positions)
    .orderBy(asc(positions.level), asc(positions.rank), asc(positions.positionName));

  const applicantCounts = await db
    .select({
      positionId: applications.positionId,
      count: sql<number>`count(*)::int`,
    })
    .from(applications)
    .groupBy(applications.positionId);

  const countMap = new Map<number, number>(
    applicantCounts.map((r) => [r.positionId, r.count])
  );

  return (
    <main className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Position Management
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Create and manage constitutional positions. The appointment method follows the
            applicable constitutional article — this portal never overrides it.
          </p>
        </div>
        <PositionCreateForm />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {rows.map((p) => (
          <Card key={p.id} className="p-5">
            <div className="flex flex-wrap items-center gap-2">
              <LevelBadge level={p.level} />
              <MethodBadge method={p.appointmentMethod} />
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                  p.vacancyStatus === "open"
                    ? "bg-emerald-50 text-emerald-800 ring-emerald-300"
                    : "bg-neutral-100 text-neutral-500 ring-neutral-300"
                }`}
              >
                {p.vacancyStatus === "open" ? "Open" : "Closed"}
              </span>
            </div>
            <h2 className="mt-3 text-base font-bold text-neutral-900">
              {p.positionName}
              {p.state ? <span className="ml-1 text-sm font-medium text-neutral-500">— {p.state}</span> : null}
            </h2>
            <p className="mt-1 text-xs text-neutral-500">
              {p.wing} · Rank #{p.rank} · {p.vacancies} vacancies · Deadline {formatDate(p.applicationDeadline)} ·{" "}
              {countMap.get(p.id) ?? 0} applicants
            </p>
            <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-neutral-600">{p.description}</p>

            <details className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50/60 p-4">
              <summary className="cursor-pointer text-xs font-bold uppercase tracking-wider text-neutral-500">
                Edit Position
              </summary>
              <div className="mt-4">
                <PositionEditForm position={p} />
              </div>
            </details>
          </Card>
        ))}
      </div>

      {rows.length === 0 ? (
        <Card className="p-10 text-center text-sm text-neutral-500">
          No positions defined yet. Create the first one.
        </Card>
      ) : null}
    </main>
  );
}
