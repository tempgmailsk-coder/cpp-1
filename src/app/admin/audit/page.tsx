import type { Metadata } from "next";
import { requireAdmin } from "@/lib/session";
import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { desc } from "drizzle-orm";
import { Card } from "@/components/ui";
import { formatDateTime } from "@/lib/constants";

export const metadata: Metadata = { title: "Audit Logs" };
export const dynamic = "force-dynamic";

export default async function AdminAuditPage() {
  await requireAdmin();

  const logs = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(200);

  return (
    <main>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Audit Logs</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Every important administrative action is recorded here — status changes,
          verifications, suspensions, role changes, appointments and official emails.
        </p>
      </div>

      <Card className="divide-y divide-neutral-100">
        {logs.map((log) => (
          <div key={log.id} className="flex flex-wrap items-start justify-between gap-3 px-5 py-3.5">
            <div className="min-w-0">
              <p className="text-sm text-neutral-800">
                <span className="font-bold text-neutral-900">{log.adminName ?? "System"}</span>{" "}
                <span className="text-neutral-600">{log.action.replaceAll("_", " ")}</span>
              </p>
              {log.targetType || log.targetId ? (
                <p className="mt-0.5 text-xs text-neutral-500">
                  {log.targetType ? `${log.targetType}: ` : ""}
                  {log.targetId ? <span className="font-mono">{log.targetId}</span> : null}
                </p>
              ) : null}
              {log.details && Object.keys(log.details).length > 0 ? (
                <p className="mt-0.5 max-w-2xl truncate text-xs text-neutral-400">
                  {JSON.stringify(log.details)}
                </p>
              ) : null}
            </div>
            <p className="shrink-0 text-xs text-neutral-400">{formatDateTime(log.createdAt)}</p>
          </div>
        ))}
        {logs.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-neutral-400">No audit records yet.</p>
        ) : null}
      </Card>
    </main>
  );
}
