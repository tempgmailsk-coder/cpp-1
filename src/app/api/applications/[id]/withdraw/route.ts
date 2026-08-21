import { NextResponse } from "next/server";
import { db } from "@/db";
import { applications, applicationEvents, positions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { jsonError, requireApiUser, guardMutatingRequest, clientIp } from "@/lib/api";
import { notify } from "@/lib/notify";
import { logAudit } from "@/lib/audit";
import { STATUS_LABELS } from "@/lib/constants";

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
  const applicationIdNum = Number(id);
  if (!Number.isInteger(applicationIdNum)) return jsonError("Invalid application.");

  const rows = await db
    .select()
    .from(applications)
    .where(
      and(eq(applications.id, applicationIdNum), eq(applications.memberId, session.sub))
    )
    .limit(1);

  const application = rows[0];
  if (!application) return jsonError("Application not found.", 404);

  const terminal = ["appointed", "rejected", "withdrawn", "selected"];
  if (terminal.includes(application.status)) {
    return jsonError(
      `An application in “${STATUS_LABELS[application.status as keyof typeof STATUS_LABELS]}” status cannot be withdrawn.`,
      409
    );
  }

  const fromStatus = application.status;
  await db
    .update(applications)
    .set({ status: "withdrawn", decisionAt: new Date() })
    .where(eq(applications.id, application.id));

  await db.insert(applicationEvents).values({
    applicationId: application.id,
    fromStatus,
    toStatus: "withdrawn",
    actorId: session.sub,
    actorName: session.name,
    note: "Withdrawn by the member.",
  });

  const positionRows = await db
    .select()
    .from(positions)
    .where(eq(positions.id, application.positionId))
    .limit(1);
  const positionName = positionRows[0]?.positionName ?? "the position";

  await notify({
    memberId: application.memberId,
    memberEmail: "",
    memberName: session.name,
    type: "application_status",
    subject: `Application withdrawn — ${positionName}`,
    message: `Your application ${application.applicationId} for ${positionName} has been withdrawn.`,
    relatedType: "application",
    relatedId: application.id,
  });

  await logAudit({
    adminName: session.name,
    action: "application_withdrawn",
    targetType: "application",
    targetId: application.applicationId,
  });

  return NextResponse.json({ ok: true, status: "withdrawn" });
}
