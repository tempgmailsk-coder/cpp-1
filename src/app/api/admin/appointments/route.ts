import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  appointments,
  applications,
  applicationEvents,
  positions,
  members,
  emailLog,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { jsonError, requireApiAdmin, guardMutatingRequest, clientIp } from "@/lib/api";
import { notify } from "@/lib/notify";
import { logAudit } from "@/lib/audit";
import { officialAppointmentEmail } from "@/lib/email";
import { METHOD_LABELS, LEVEL_LABELS, STATUS_LABELS } from "@/lib/constants";
import { appointmentRefForYear, applicationRefForYear } from "@/lib/auth";
import { APPOINTMENT_ROLES, type Role } from "@/db/schema";

const APPOINTMENT_SCHEMA = z.object({
  applicationId: z.coerce.number().int().positive(),
  appointingAuthority: z.string().trim().min(3, "Appointing authority is required"),
  authorityRole: z.string().trim().optional(),
  appointmentMethod: z
    .enum([
      "election",
      "electoral_college",
      "appointment",
      "joint_appointment",
      "provisional_appointment",
      "committee_selection",
    ])
    .optional(),
  effectiveDate: z.string().min(1, "Effective date is required"),
});

/** Returns { error } or { admin } with the full admin member row. */
async function loadAdmin(session: { sub: number; name: string; role: Role }) {
  const rows = await db.select().from(members).where(eq(members.id, session.sub)).limit(1);
  return rows[0] ?? null;
}

export async function POST(req: Request) {
  const guard = await guardMutatingRequest(req);
  if (guard) return guard;

  const auth = await requireApiAdmin(req, clientIp(req));
  if ("error" in auth) return auth.error;
  const { session } = auth;

  // Only authorized administrators may trigger official appointment notifications.
  if (!APPOINTMENT_ROLES.includes(session.role as Role)) {
    return jsonError(
      "Only the Super Administrator, a National Administrator or an authorized Appointment Authority may confirm appointments and send official appointment emails.",
      403
    );
  }

  const admin = await loadAdmin(session);
  if (!admin) return jsonError("Administrator account not found.", 404);

  const body = await req.json().catch(() => null);
  const parsed = APPOINTMENT_SCHEMA.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }
  const data = parsed.data;

  const applicationRows = await db
    .select()
    .from(applications)
    .where(eq(applications.id, data.applicationId))
    .limit(1);
  const application = applicationRows[0];
  if (!application) return jsonError("Application not found.", 404);

  if (application.status !== "selected") {
    return jsonError(
      "Only a selected application can be appointed. Current status: " +
        STATUS_LABELS[application.status as keyof typeof STATUS_LABELS] +
        ".",
      409
    );
  }

  const existingAppointment = await db
    .select({ id: appointments.id })
    .from(appointments)
    .where(eq(appointments.applicationId, application.id))
    .limit(1);
  if (existingAppointment.length > 0) {
    return jsonError("An appointment record already exists for this application.", 409);
  }

  const positionRows = await db
    .select()
    .from(positions)
    .where(eq(positions.id, application.positionId))
    .limit(1);
  const position = positionRows[0];
  if (!position) return jsonError("Position not found.", 404);

  const memberRows = await db
    .select()
    .from(members)
    .where(eq(members.id, application.memberId))
    .limit(1);
  const member = memberRows[0];
  if (!member) return jsonError("Member not found.", 404);

  const method = data.appointmentMethod ?? position.appointmentMethod;
  const effectiveDate = new Date(data.effectiveDate);
  if (Number.isNaN(effectiveDate.getTime())) return jsonError("Invalid effective date.");

  // Insert with placeholder ids, then stamp the real reference numbers.
  const inserted = await db
    .insert(appointments)
    .values({
      appointmentId: "PENDING",
      referenceNumber: "PENDING",
      applicationId: application.id,
      memberId: member.id,
      positionId: position.id,
      appointingAuthority: data.appointingAuthority,
      authorityRole: data.authorityRole || admin.role,
      appointmentMethod: method,
      appointmentDate: new Date(),
      effectiveDate,
      appointmentStatus: "confirmed",
      createdBy: admin.id,
    })
    .returning({ id: appointments.id });

  const appointmentRowId = inserted[0]!.id;
  const appointmentId = appointmentRefForYear(appointmentRowId);
  const referenceNumber = applicationRefForYear(appointmentRowId);

  await db
    .update(appointments)
    .set({ appointmentId, referenceNumber })
    .where(eq(appointments.id, appointmentRowId));

  // Official appointment email to the registered email address.
  const noticeUrl = null; // no attached notice document in v1
  const emailResult = await notify({
    memberId: member.id,
    memberEmail: member.email,
    memberName: member.name,
    type: "appointment",
    subject: `Official Appointment Notification — ${position.positionName}`,
    message: `You have been officially appointed to ${position.positionName} (${LEVEL_LABELS[position.level]}). Reference: ${referenceNumber}.`,
    html: officialAppointmentEmail({
      name: member.name,
      memberId: member.memberId,
      positionName: position.positionName,
      level: LEVEL_LABELS[position.level] ?? position.level,
      appointmentDate: new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
      effectiveDate: effectiveDate.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
      appointingAuthority: data.appointingAuthority,
      referenceNumber,
      applicationId: application.applicationId,
      noticeUrl,
    }),
    relatedType: "appointment",
    relatedId: appointmentRowId,
  });

  await db
    .update(appointments)
    .set({ officialEmailId: emailResult.emailLogId })
    .where(eq(appointments.id, appointmentRowId));

  // Move the application to Appointed and record the event.
  await db
    .update(applications)
    .set({ status: "appointed", decisionAt: new Date(), reviewedAt: application.reviewedAt ?? new Date() })
    .where(eq(applications.id, application.id));

  await db.insert(applicationEvents).values({
    applicationId: application.id,
    fromStatus: "selected",
    toStatus: "appointed",
    actorId: admin.id,
    actorName: admin.name,
    note: `Appointed by ${data.appointingAuthority}. Reference ${referenceNumber}.`,
  });

  // Reduce the vacancy count.
  const newVacancies = Math.max(0, (position.vacancies ?? 1) - 1);
  await db
    .update(positions)
    .set({
      vacancies: newVacancies,
      vacancyStatus: newVacancies === 0 ? "closed" : position.vacancyStatus,
      updatedAt: new Date(),
    })
    .where(eq(positions.id, position.id));

  await logAudit({
    adminId: admin.id,
    adminName: admin.name,
    action: "appointment_confirmed",
    targetType: "appointment",
    targetId: appointmentId,
    details: {
      member: member.memberId,
      position: position.positionName,
      authority: data.appointingAuthority,
      method: METHOD_LABELS[method as keyof typeof METHOD_LABELS] ?? method,
      referenceNumber,
      officialEmailSent: emailResult.emailLogId != null,
    },
  });

  return NextResponse.json({
    ok: true,
    appointment: {
      id: appointmentRowId,
      appointmentId,
      referenceNumber,
      memberName: member.name,
      positionName: position.positionName,
      appointingAuthority: data.appointingAuthority,
      effectiveDate: effectiveDate.toISOString(),
      emailStatus: emailResult.emailLogId ? "sent" : "not-sent",
    },
  });
}

export async function GET() {
  return jsonError("Method not allowed.", 405);
}
