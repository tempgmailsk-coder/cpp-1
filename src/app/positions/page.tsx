import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PositionsList } from "@/components/positions-list";
import { db } from "@/db";
import { positions } from "@/db/schema";
import { asc } from "drizzle-orm";
import { getSession } from "@/lib/session";
import type { PositionRow } from "@/db/types";

export const metadata: Metadata = { title: "Positions" };
export const dynamic = "force-dynamic";

export default async function PositionsPage() {
  const rows: PositionRow[] = await db
    .select()
    .from(positions)
    .orderBy(asc(positions.level), asc(positions.rank), asc(positions.positionName));
  const session = await getSession();

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
                Positions Directory
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-500">
                Constitutional positions of the CPP as defined by the Constitution — national
                offices and state-level structures that replicate the national structure
                where applicable.
              </p>
            </div>
          </div>
          <div className="mt-8">
            <PositionsList positions={rows} isLoggedIn={!!session} />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
