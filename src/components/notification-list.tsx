"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui";
import { formatDateTime, NOTIFICATION_TYPES } from "@/lib/constants";

export interface NotifItem {
  id: number;
  type: string;
  subject: string;
  message: string | null;
  read: boolean;
  createdAt: string;
  emailStatus?: string | null;
}

export function NotificationList({ items }: { items: NotifItem[] }) {
  const router = useRouter();
  const [busyIds, setBusyIds] = useState<Set<number>>(new Set());
  const [markingAll, setMarkingAll] = useState(false);

  async function markRead(id: number) {
    if (busyIds.has(id)) return;
    setBusyIds((prev) => new Set(prev).add(id));
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "POST" });
      router.refresh();
    } finally {
      setBusyIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  async function markAll() {
    setMarkingAll(true);
    try {
      for (const item of items.filter((i) => !i.read)) {
        await fetch(`/api/notifications/${item.id}/read`, { method: "POST" });
      }
      router.refresh();
    } finally {
      setMarkingAll(false);
    }
  }

  const hasUnread = items.some((i) => !i.read);

  return (
    <div className="space-y-4">
      {hasUnread ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={markAll}
            disabled={markingAll}
            className="text-xs font-semibold text-neutral-600 underline underline-offset-2 hover:text-neutral-900 disabled:opacity-50"
          >
            {markingAll ? "Marking…" : "Mark all as read"}
          </button>
        </div>
      ) : null}

      {items.length === 0 ? (
        <Card className="p-10 text-center text-sm text-neutral-500">
          No notifications yet.
        </Card>
      ) : (
        <Card className="divide-y divide-neutral-100">
          {items.map((n) => (
            <div
              key={n.id}
              className={`flex items-start justify-between gap-4 px-5 py-4 ${n.read ? "" : "bg-neutral-50/60"}`}
            >
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-neutral-900">
                  {n.subject}
                  <span className="rounded-full border border-neutral-200 bg-white px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-neutral-500">
                    {NOTIFICATION_TYPES[n.type] ?? n.type}
                  </span>
                  {n.emailStatus ? (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
                      Email recorded
                    </span>
                  ) : null}
                </p>
                {n.message ? (
                  <p className="mt-1 text-sm leading-relaxed text-neutral-600">{n.message}</p>
                ) : null}
                <p className="mt-1 text-[11px] text-neutral-400">{formatDateTime(n.createdAt)}</p>
              </div>
              {!n.read ? (
                <button
                  type="button"
                  onClick={() => markRead(n.id)}
                  disabled={busyIds.has(n.id)}
                  className="shrink-0 text-xs font-semibold text-neutral-500 underline underline-offset-2 hover:text-neutral-900 disabled:opacity-50"
                >
                  Mark read
                </button>
              ) : null}
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
