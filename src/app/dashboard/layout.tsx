import type { ReactNode } from "react";
import { requireMember } from "@/lib/session";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { DashboardNav } from "@/components/dashboard-nav";
import { SiteFooter } from "@/components/site-footer";
import { Wordmark } from "@/components/branding";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const member = await requireMember();

  const unreadRows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(and(eq(notifications.memberId, member.id), eq(notifications.read, false)));
  const unread = unreadRows[0]?.count ?? 0;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/dashboard">
            <Wordmark size="sm" />
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <Link
              href="/positions"
              className="hidden font-medium text-neutral-600 transition hover:text-neutral-900 sm:block"
            >
              Positions
            </Link>
            <Link
              href="/dashboard/notifications"
              className="relative rounded-lg border border-neutral-200 bg-white p-2 text-neutral-600 transition hover:bg-neutral-50"
              aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
              {unread > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-neutral-900 px-1 text-[10px] font-bold text-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              ) : null}
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 md:flex-row">
        <DashboardNav
          unread={unread}
          name={member.name}
          memberId={member.memberId}
          role={member.role}
          photoDocumentId={member.photoDocumentId}
        />
        <div className="min-w-0 flex-1">{children}</div>
      </div>

      <SiteFooter />
    </div>
  );
}
