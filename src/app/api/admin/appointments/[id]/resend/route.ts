import { NextResponse } from "next/server";
import { db } from "@/db";
import { appointments, applications, positions, members } from "@/db/schema";
import { eq } from "drizzle-orm";
import { jsonError, requireApiAdmin, guardMutatingRequest, clientIp } from "@/lib/api";
import { notify } from "@/lib/notify";
import { logAudit } from "@/lib/audit";
import { officialAppointmentEmail } from "@/lib/email";
import { LEVEL_LABELS } from "@/lib/constants";
import { APPOINTMENT_ROLES, type Role } from "@/db/schema";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await guardMutatingRequest(req);
  if (guard) return guard;

  const auth = await requireApiAdmin(req, clientIp(req));
  if ("error" in auth) return auth.error;
  const { session } = auth;

  if (!APPOINTMENT_ROLES.includes(session.role as Role)) {
    return jsonError("You are not authorized to send official appointment emails.", 403);
  }

  const { id } = await params;
  const appointmentIdNum = Number(id);
  if (!Number.isInteger(appointmentIdNum)) return jsonError("Invalid appointment.");

  const rows = await db
    .select()
    .from(appointments)
    .where(eq(appointments.id, appointmentIdNum))
    .limit(1);
  const appointment = rows[0];
  if (!appointment) return jsonError("Appointment not found.", 404);

  const memberRows = await db
    .select()
    .from(members)
    .where(eq(members.id, appointment.memberId))
    .limit(1);
  const positionRows = await db
    .select()
    .from(positions)
    .where(eq(positions.id, appointment.positionId))
    .limit(1);
  const applicationRows = await db
    .select()
    .from(applications)
    .where(eq(applications.id, appointment.applicationId))
    .limit(1);

  const member = memberRows[0];
  const position = positionRows[0];
  const application = applicationRows[0];
  if (!member || !position || !application) {
    return jsonError("Appointment data is incomplete.", 500);
  }

  const result = await notify({
    memberId: member.id,
    memberEmail: member.email,
    memberName: member.name,
    type: "appointment",
    subject: `Official Appointment Notification — ${position.positionName}`,
    message: `Official appointment notification reissued for ${position.positionName}. Reference: ${appointment.referenceNumber}.`,
    html: officialAppointmentEmail({
      name: member.name,
      memberId: member.memberId,
      positionName: position.positionName,
      level: LEVEL_LABELS[position.level] ?? position.level,
      appointmentDate: new Date(appointment.appointmentDate).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
      effectiveDate: new Date(appointment.effectiveDate).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
      appointingAuthority: appointment.appointingAuthority,
      referenceNumber: appointment.referenceNumber,
      applicationId: application.applicationId,
      noticeUrl: null,
    }),
    relatedType: "appointment",
    relatedId: appointment.id,
  });

  await db
    .update(appointments)
    .set({ officialEmailId: result.emailLogId })
    .where(eq(appointments.id, appointment.id));

  await logAudit({
    adminId: session.sub,
    adminName: session.name,
    action: "appointment_email_resent",
    targetType: "appointment",
    targetId: appointment.appointmentId,
    details: { by: session.name, referenceNumber: appointment.referenceNumber },
  });

  return NextResponse.json({ ok: true, emailLogId: result.emailLogId });
}
