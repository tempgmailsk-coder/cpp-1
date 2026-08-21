import type { Metadata } from "next";
import { requireAdmin } from "@/lib/session";
import { db } from "@/db";
import { emailLog } from "@/db/schema";
import { desc } from "drizzle-orm";
import { Card } from "@/components/ui";
import { formatDateTime } from "@/lib/constants";
import { isDemoEmailMode } from "@/lib/email";

export const metadata: Metadata = { title: "Email Outbox" };
export const dynamic = "force-dynamic";

export default async function AdminEmailsPage() {
  await requireAdmin();

  const emails = await db.select().from(emailLog).orderBy(desc(emailLog.createdAt)).limit(100);
  const demo = isDemoEmailMode();

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Email Outbox</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Transactional email log — registration confirmations, verification links, status
          updates and official appointment notifications.
        </p>
        {demo ? (
          <p className="mt-3 rounded-lg border border-neutral-300 bg-neutral-100 px-4 py-3 text-xs text-neutral-600">
            <strong>Demo email mode.</strong> No transactional email provider is configured
            (SENDGRID_API_KEY), so emails are recorded in this outbox instead of being
            delivered. Configure an API key to send real emails.
          </p>
        ) : null}
      </div>

      <Card className="divide-y divide-neutral-100">
        {emails.map((e) => (
          <details key={e.id} className="group px-5 py-4">
            <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-neutral-900">{e.subject}</p>
                <p className="truncate text-xs text-neutral-500">
                  To: {e.toEmail}
                  {e.relatedType ? ` · ${e.relatedType} #${e.relatedId ?? ""}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                    e.status === "sent"
                      ? "bg-emerald-50 text-emerald-800 ring-emerald-300"
                      : e.status === "failed"
                        ? "bg-red-50 text-red-700 ring-red-300"
                        : "bg-neutral-100 text-neutral-500 ring-neutral-300"
                  }`}
                >
                  {e.status} {e.provider ? `· ${e.provider}` : ""}
                </span>
                <span className="text-xs text-neutral-400">{formatDateTime(e.createdAt)}</span>
              </div>
            </summary>
            {e.error ? (
              <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                {e.error}
              </p>
            ) : null}
            <div
              className="mt-3 max-h-96 overflow-auto rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-xs leading-relaxed text-neutral-700"
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: e.bodyHtml ?? "" }}
            />
          </details>
        ))}
        {emails.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-neutral-400">
            No emails recorded yet.
          </p>
        ) : null}
      </Card>
    </main>
  );
}
