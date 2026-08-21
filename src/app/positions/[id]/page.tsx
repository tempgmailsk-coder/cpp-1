import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import {
  Card,
  MethodBadge,
  LevelBadge,
  KV,
  EmptyState,
  btnPrimary,
  btnSecondary,
} from "@/components/ui";
import { db } from "@/db";
import { positions, applications } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/session";
import {
  METHOD_LABELS,
  METHOD_DESCRIPTIONS,
  formatDate,
} from "@/lib/constants";
import type { AppointmentMethod } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function PositionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const positionId = Number(id);
  if (!Number.isInteger(positionId)) notFound();

  const rows = await db
    .select()
    .from(positions)
    .where(eq(positions.id, positionId))
    .limit(1);
  const position = rows[0];
  if (!position) notFound();

  const session = await getSession();
  const applicantCount = await db
    .select({ count: applications.id })
    .from(applications)
    .where(eq(applications.positionId, position.id))
    .orderBy(desc(applications.submittedAt));

  const open = position.vacancyStatus === "open";

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
          <Link
            href="/positions"
            className="text-sm font-semibold text-neutral-500 underline underline-offset-2 hover:text-neutral-900"
          >
            ← Back to Positions Directory
          </Link>

          <div className="mt-6">
            <div className="flex flex-wrap items-center gap-2">
              <LevelBadge level={position.level} />
              <MethodBadge method={position.appointmentMethod} />
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                  open
                    ? "bg-emerald-50 text-emerald-800 ring-emerald-300"
                    : "bg-neutral-100 text-neutral-500 ring-neutral-300"
                }`}
              >
                {open ? "Vacancy Open" : "Vacancy Closed"}
              </span>
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
              {position.positionName}
              {position.state ? (
                <span className="ml-2 text-xl font-medium text-neutral-500">
                  — {position.state}
                </span>
              ) : null}
            </h1>
            <p className="mt-2 text-sm font-semibold uppercase tracking-wider text-neutral-400">
              {position.wing} · Rank #{position.rank}
              {position.constitutionalReference
                ? ` · ${position.constitutionalReference}`
                : ""}
            </p>
          </div>

          <div className="mt-8 space-y-6">
            <Card className="p-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-500">
                Responsibilities
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-neutral-700">
                {position.description}
              </p>
              {(position.responsibilities ?? []).length > 0 ? (
                <ul className="mt-4 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-neutral-700">
                  {(position.responsibilities ?? []).map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              ) : null}
            </Card>

            <Card className="p-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-500">
                Selection / Appointment Method
              </h2>
              <p className="mt-2 text-lg font-semibold text-neutral-900">
                {METHOD_LABELS[position.appointmentMethod as AppointmentMethod]}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                {
                  METHOD_DESCRIPTIONS[
                    position.appointmentMethod as AppointmentMethod
                  ]
                }
              </p>
              <p className="mt-3 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-xs leading-relaxed text-neutral-600">
                The appointment method is defined by the Constitution and cannot be
                overridden by this portal. The workflow follows the applicable
                constitutional article.
              </p>
            </Card>

            <Card className="p-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-500">
                Eligibility
              </h2>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-neutral-700">
                {(position.eligibility ?? []).map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </Card>

            <Card className="p-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-500">
                Position Information
              </h2>
              <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
                <KV label="Level" value={position.level === "national" ? "National" : "State"} />
                <KV label="Wing" value={position.wing} />
                <KV label="Rank" value={`#${position.rank}`} />
                <KV label="Vacancies" value={String(position.vacancies)} />
                <KV label="Vacancy Status" value={open ? "Open" : "Closed"} />
                <KV
                  label="Application Deadline"
                  value={formatDate(position.applicationDeadline)}
                />
                <KV label="Term" value={position.termInfo ?? "—"} />
                <KV
                  label="Applications Received"
                  value={String(applicantCount.length)}
                />
                <KV
                  label="Constitutional Reference"
                  value={position.constitutionalReference ?? "CPP Constitution"}
                />
              </dl>
            </Card>

            <div className="flex flex-wrap gap-3">
              {open ? (
                <Link
                  href={
                    session
                      ? `/dashboard/apply/${position.id}`
                      : `/login?next=/dashboard/apply/${position.id}`
                  }
                  className={btnPrimary}
                >
                  Apply for this Position
                </Link>
              ) : (
                <span className="inline-flex cursor-not-allowed items-center rounded-lg bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-400">
                  Applications Closed
                </span>
              )}
              <Link href="/positions" className={btnSecondary}>
                View All Positions
              </Link>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return { title: `Position #${id}` };
}
