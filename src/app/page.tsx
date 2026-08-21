import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Emblem, Flag } from "@/components/branding";
import { Card, btnPrimary, btnSecondary } from "@/components/ui";
import { ORG_NAME, TAGLINE, CONSTITUTION_TITLE } from "@/lib/constants";
import { db } from "@/db";
import { positions, members } from "@/db/schema";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const positionCount = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(positions);
  const memberCount = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(members);
  const openCount = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(positions)
    .where(sql`vacancy_status = 'open'`);

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-neutral-200 bg-white">
          <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-16 sm:px-6 md:grid-cols-[1fr_auto] md:items-center md:py-24">
            <div>
              <div className="flex items-center gap-3">
                <Emblem className="h-16 w-16 sm:h-20 sm:w-20" />
                <Flag className="h-3 w-24" />
              </div>
              <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-neutral-950 sm:text-5xl">
                Common People&apos;s Party
              </h1>
              <p className="mt-4 max-w-xl text-lg font-medium leading-snug text-neutral-700">
                {TAGLINE}
              </p>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-neutral-500">
                The CPP is organized under the{" "}
                <Link
                  href="/constitution"
                  className="font-semibold text-neutral-900 underline decoration-neutral-300 underline-offset-2 hover:decoration-neutral-900"
                >
                  {CONSTITUTION_TITLE}
                </Link>{" "}
                — a comprehensive operational and governance framework that defines
                constitutional positions, appointment methods and accountability for every
                level of the organization.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/register" className={btnPrimary}>
                  Register
                </Link>
                <Link href="/login" className={btnSecondary}>
                  Login
                </Link>
                <Link href="/positions" className={btnSecondary}>
                  View Positions
                </Link>
                <Link href="/constitution" className={btnSecondary}>
                  Constitution
                </Link>
              </div>
            </div>

            {/* Hierarchy snapshot */}
            <Card className="w-full p-6 md:w-80">
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                National Structure
              </p>
              <ol className="mt-4 space-y-2.5 text-sm">
                {[
                  "National President",
                  "National Chairperson",
                  "National Party Leader",
                  "National Committee",
                  "National Treasurer",
                  "State Presidents",
                  "35 National Secretaries",
                ].map((item, i) => (
                  <li key={item} className="flex items-center gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-[11px] font-bold text-white">
                      {i + 1}
                    </span>
                    <span className="font-medium text-neutral-800">{item}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-4 border-t border-neutral-200 pt-3 text-xs leading-relaxed text-neutral-500">
                State-level structures replicate the national structure where applicable,
                as provided in the Constitution.
              </p>
            </Card>
          </div>
        </section>

        {/* Stats */}
        <section className="border-b border-neutral-200 bg-neutral-50">
          <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-4 px-4 py-10 sm:grid-cols-3 sm:px-6">
            <Stat label="Constitutional Positions" value={positionCount[0]?.count ?? 0} />
            <Stat label="Open Vacancies" value={openCount[0]?.count ?? 0} />
            <Stat label="Registered Members" value={memberCount[0]?.count ?? 0} />
          </div>
        </section>

        {/* Flow */}
        <section className="bg-white">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
            <h2 className="text-center text-2xl font-bold tracking-tight text-neutral-900">
              How the portal works
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-center text-sm text-neutral-500">
              A simple, transparent flow from membership to office.
            </p>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {[
                { n: "1", t: "Registration", d: "Join as a member and verify your email address." },
                { n: "2", t: "Position Application", d: "Apply for constitutional positions you are eligible for." },
                { n: "3", t: "Review", d: "Administrators review, verify and shortlist applications." },
                { n: "4", t: "Selection / Appointment", d: "Authorized authorities record the selection or appointment." },
                { n: "5", t: "Official Email", d: "An official appointment notification is emailed to the member." },
              ].map((s) => (
                <Card key={s.n} className="p-5">
                  <span className="text-xs font-bold text-neutral-400">STEP {s.n}</span>
                  <p className="mt-2 text-sm font-semibold text-neutral-900">{s.t}</p>
                  <p className="mt-1 text-xs leading-relaxed text-neutral-500">{s.d}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Constitution CTA */}
        <section className="border-t border-neutral-200 bg-neutral-950 text-white">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-6 px-4 py-14 sm:px-6 md:flex-row md:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
                Source of authority
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight">
                {CONSTITUTION_TITLE}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-300">
                Every position, appointment method and eligibility rule on this portal is
                defined by the Constitution. Read the chapters and articles, search the
                text, or download the PDF.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/constitution"
                className="inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-200"
              >
                Read the Constitution
              </Link>
              <Link
                href="/cpp-constitution.pdf"
                target="_blank"
                className="inline-flex items-center rounded-lg border border-neutral-600 px-4 py-2 text-sm font-semibold text-white transition hover:border-neutral-300"
              >
                Open PDF
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white px-5 py-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{label}</p>
      <p className="mt-1 text-3xl font-extrabold tracking-tight text-neutral-900">{value}</p>
    </div>
  );
}
