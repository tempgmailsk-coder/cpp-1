import { NextResponse } from "next/server";
import { db } from "@/db";
import { applications, applicationEvents, positions, members } from "@/db/schema";
import { eq } from "drizzle-orm";
import { jsonError, requireApiAdmin, guardMutatingRequest, clientIp } from "@/lib/api";
import { notify } from "@/lib/notify";
import { logAudit } from "@/lib/audit";
import { applicationStatusEmail } from "@/lib/email";
import { STATUS_TRANSITIONS, STATUS_LABELS } from "@/lib/constants";
import type { ApplicationStatus } from "@/db/schema";

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
  const toStatus = body?.toStatus as string;
  const note = String(body?.note ?? "").slice(0, 500);

  const rows = await db
    .select()
    .from(applications)
    .where(eq(applications.id, applicationIdNum))
    .limit(1);
  const application = rows[0];
  if (!application) return jsonError("Application not found.", 404);

  const fromStatus = application.status as ApplicationStatus;
  const allowed = STATUS_TRANSITIONS[fromStatus] ?? [];
  if (!allowed.includes(toStatus as ApplicationStatus)) {
    return jsonError(
      `Cannot move an application from “${STATUS_LABELS[fromStatus]}” to “${STATUS_LABELS[toStatus as ApplicationStatus] ?? toStatus}”. This transition is not permitted in the review workflow.`,
      409
    );
  }
  if (toStatus === "appointed") {
    return jsonError(
      "Appointments must be recorded through Appointment Management, which generates the official appointment notice and email.",
      403
    );
  }

  const isDecision = toStatus === "rejected" || toStatus === "selected";
  await db
    .update(applications)
    .set({
      status: toStatus,
      reviewedAt: application.reviewedAt ?? new Date(),
      decisionAt: isDecision ? new Date() : application.decisionAt,
    })
    .where(eq(applications.id, application.id));

  await db.insert(applicationEvents).values({
    applicationId: application.id,
    fromStatus,
    toStatus,
    actorId: session.sub,
    actorName: session.name,
    note: note || null,
  });

  const positionRows = await db
    .select()
    .from(positions)
    .where(eq(positions.id, application.positionId))
    .limit(1);
  const memberRows = await db
    .select()
    .from(members)
    .where(eq(members.id, application.memberId))
    .limit(1);

  const position = positionRows[0];
  const member = memberRows[0];
  const statusLabel = STATUS_LABELS[toStatus as ApplicationStatus];

  if (member && position) {
    await notify({
      memberId: member.id,
      memberEmail: member.email,
      memberName: member.name,
      type: `application_${toStatus === "rejected" ? "rejected" : "status"}`,
      subject: `Application ${statusLabel} — ${position.positionName}`,
      message: `Your application ${application.applicationId} for ${position.positionName} is now ${statusLabel}.${note ? ` Note: ${note}` : ""}`,
      html: applicationStatusEmail(
        member.name,
        application.applicationId,
        position.positionName,
        statusLabel
      ),
      relatedType: "application",
      relatedId: application.id,
    });
  }

  await logAudit({
    adminId: session.sub,
    adminName: session.name,
    action: "application_status_changed",
    targetType: "application",
    targetId: application.applicationId,
    details: {
      from: fromStatus,
      to: toStatus,
      note,
      by: session.name,
    },
  });

  return NextResponse.json({ ok: true, status: toStatus });
}
