import { NextResponse } from "next/server";
import { db } from "@/db";
import { applications } from "@/db/schema";
import { eq } from "drizzle-orm";
import { jsonError, requireApiAdmin, guardMutatingRequest, clientIp } from "@/lib/api";
import { logAudit } from "@/lib/audit";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await guardMutatingRequest(req);
  if (guard) return guard;

  const auth = await requireApiAdmin(req, clientIp(req));
  if ("error" in auth) return auth.error;
  const { session } = auth;

  const { id } = await params;
  const applicationIdNum = Number(id);
  if (!Number.isInteger(applicationIdNum)) return jsonError("Invalid application.");

  const body = await req.json().catch(() => null);
  const note = String(body?.note ?? "").trim().slice(0, 1000);
  if (!note) return jsonError("Note cannot be empty.");

  const rows = await db
    .select()
    .from(applications)
    .where(eq(applications.id, applicationIdNum))
    .limit(1);
  const application = rows[0];
  if (!application) return jsonError("Application not found.", 404);

  const existing = application.internalNotes ?? [];
  const updated = [
    ...existing,
    {
      adminId: session.sub,
      adminName: session.name,
      note,
      createdAt: new Date().toISOString(),
    },
  ];

  await db
    .update(applications)
    .set({ internalNotes: updated })
    .where(eq(applications.id, application.id));

  await logAudit({
    adminId: session.sub,
    adminName: session.name,
    action: "application_note_added",
    targetType: "application",
    targetId: application.applicationId,
    details: { note, by: session.name },
  });

  return NextResponse.json({ ok: true });
}
