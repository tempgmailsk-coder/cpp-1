import { NextResponse } from "next/server";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { jsonError, requireApiUser, guardMutatingRequest, clientIp } from "@/lib/api";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await guardMutatingRequest(req);
  if (guard) return guard;

  const auth = await requireApiUser(req, clientIp(req));
  if ("error" in auth) return auth.error;
  const { session } = auth;

  const { id } = await params;
  const notifId = Number(id);
  if (!Number.isInteger(notifId)) return jsonError("Invalid notification.");

  const rows = await db
    .select()
    .from(notifications)
    .where(and(eq(notifications.id, notifId), eq(notifications.memberId, session.sub)))
    .limit(1);
  if (!rows[0]) return jsonError("Notification not found.", 404);

  await db.update(notifications).set({ read: true }).where(eq(notifications.id, notifId));
  return NextResponse.json({ ok: true });
}
