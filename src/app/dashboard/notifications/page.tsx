import type { Metadata } from "next";
import { requireMember } from "@/lib/session";
import { db } from "@/db";
import { notifications, emailLog } from "@/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { NotificationList, type NotifItem } from "@/components/notification-list";

export const metadata: Metadata = { title: "Notifications" };
export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const member = await requireMember();

  const rows = await db
    .select({
      id: notifications.id,
      type: notifications.type,
      subject: notifications.subject,
      message: notifications.message,
      read: notifications.read,
      createdAt: notifications.createdAt,
      emailLogId: notifications.emailLogId,
    })
    .from(notifications)
    .where(eq(notifications.memberId, member.id))
    .orderBy(desc(notifications.createdAt));

  const emailIds = rows.map((r) => r.emailLogId).filter((v): v is number => v != null);
  let emailStatuses = new Map<number, string>();
  if (emailIds.length > 0) {
    const logs = await db
      .select({ id: emailLog.id, status: emailLog.status })
      .from(emailLog)
      .where(inArray(emailLog.id, emailIds));
    emailStatuses = new Map(logs.map((l) => [l.id, l.status]));
  }

  const items: NotifItem[] = rows.map((r) => ({
    id: r.id,
    type: r.type,
    subject: r.subject,
    message: r.message,
    read: r.read,
    createdAt: r.createdAt.toISOString(),
    emailStatus: r.emailLogId ? (emailStatuses.get(r.emailLogId) ?? "logged") : null,
  }));

  return (
    <main>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Notifications</h1>
        <p className="mt-1 text-sm text-neutral-500">
          System messages and official communications. Important notices are also emailed to
          your registered address.
        </p>
      </div>
      <NotificationList items={items} />
    </main>
  );
}
