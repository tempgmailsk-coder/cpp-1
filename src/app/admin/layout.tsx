import type { ReactNode } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/session";
import { AdminNav } from "@/components/admin-nav";
import { Wordmark } from "@/components/branding";
import { ROLE_LABELS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdmin();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/admin">
            <Wordmark size="sm" />
          </Link>
          <span className="rounded-full border border-neutral-300 bg-neutral-50 px-3 py-1 text-xs font-semibold text-neutral-700">
            {ROLE_LABELS[admin.role] ?? admin.role}
          </span>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 md:flex-row">
        <AdminNav name={admin.name} memberId={admin.memberId} />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
