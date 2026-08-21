import { NextResponse } from "next/server";
import { db } from "@/db";
import { applications, applicationEvents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { APPLICATION_SCHEMA, applicationRefForYear } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { jsonError, clientIp, guardMutatingRequest, requireApiUser } from "@/lib/api";
import { saveFile, createDocument, DOC_TYPES } from "@/lib/storage";
import { checkEligibility, getPositionOrThrow } from "@/lib/eligibility";
import { applicationSubmittedEmail } from "@/lib/email";
import { notify } from "@/lib/notify";
import { logAudit } from "@/lib/audit";
import { STATUS_LABELS, METHOD_LABELS } from "@/lib/constants";

export async function POST(req: Request) {
  const guard = await guardMutatingRequest(req);
  if (guard) return guard;

  const auth = await requireApiUser(req, clientIp(req));
  if ("error" in auth) return auth.error;
  const { session } = auth;

  const rl = rateLimit(`apply:${session.sub}`, 5, 60_000);
  if (!rl.ok) return jsonError("Too many submissions. Please wait a minute.", 429);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return jsonError("Invalid form submission.");
  }

  const parsed = APPLICATION_SCHEMA.safeParse({
    positionId: form.get("positionId"),
    state: form.get("state"),
    district: form.get("district"),
    education: form.get("education"),
    professionalExperience: form.get("professionalExperience"),
    organizationalExperience: form.get("organizationalExperience"),
    relevantSkills: form.get("relevantSkills"),
    leadershipExperience: form.get("leadershipExperience"),
    motivation: form.get("motivation"),
    declaration: form.get("declaration") === "true",
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }
  const data = parsed.data;

  const { db: dbClient } = await import("@/db");
  const { members } = await import("@/db/schema");
  const memberRows = await dbClient
    .select()
    .from(members)
    .where(eq(members.id, session.sub))
    .limit(1);
  const member = memberRows[0];
  if (!member) return jsonError("Member not found.", 404);

  let position;
  try {
    position = await getPositionOrThrow(data.positionId);
  } catch {
    return jsonError("Position not found.", 404);
  }

  // Constitutional eligibility check (server-side, never bypassed).
  const eligibility = await checkEligibility(member, position);
  if (!eligibility.ok) {
    return NextResponse.json(
      { error: "You are not currently eligible for this position.", reasons: eligibility.reasons },
      { status: 409 }
    );
  }

  // Supporting documents
  const docList: { documentId: number; name: string; mime: string }[] = [];
  const files = form.getAll("documents").filter((f) => f instanceof File && f.size > 0) as File[];
  if (files.length > 5) return jsonError("Maximum 5 supporting documents allowed.");
  for (const file of files) {
    try {
      const saved = await saveFile(file, DOC_TYPES, 10 * 1024 * 1024);
      const docId = await createDocument({
        ownerId: member.id,
        kind: "application_document",
        originalName: file.name,
        storedName: saved.storedName,
        mime: saved.mime,
        size: saved.size,
      });
      docList.push({ documentId: docId, name: file.name, mime: saved.mime });
    } catch (err) {
      return jsonError(err instanceof Error ? err.message : "Document upload failed.");
    }
  }

  const inserted = await db
    .insert(applications)
    .values({
      applicationId: "PENDING",
      memberId: member.id,
      positionId: position.id,
      status: "submitted",
      answers: {
        state: data.state,
        district: data.district,
        education: data.education,
        professionalExperience: data.professionalExperience,
        organizationalExperience: data.organizationalExperience,
        relevantSkills: data.relevantSkills,
        leadershipExperience: data.leadershipExperience,
        motivation: data.motivation,
      },
      documents: docList,
      submittedAt: new Date(),
    })
    .returning({ id: applications.id });

  const applicationId = applicationRefForYear(inserted[0]!.id);
  await db
    .update(applications)
    .set({ applicationId })
    .where(eq(applications.id, inserted[0]!.id));

  await db.insert(applicationEvents).values({
    applicationId: inserted[0]!.id,
    fromStatus: null,
    toStatus: "submitted",
    actorId: member.id,
    actorName: member.name,
    note: "Application submitted by the member.",
  });

  await notify({
    memberId: member.id,
    memberEmail: member.email,
    memberName: member.name,
    type: "application_submitted",
    subject: `Application submitted — ${position.positionName}`,
    message: `Your application ${applicationId} for ${position.positionName} has been submitted. Current status: Submitted.`,
    html: applicationSubmittedEmail(member.name, applicationId, position.positionName),
    relatedType: "application",
    relatedId: inserted[0]!.id,
  });

  await logAudit({
    adminName: member.name,
    action: "application_submitted",
    targetType: "application",
    targetId: applicationId,
    details: {
      memberId: member.memberId,
      position: position.positionName,
      method: METHOD_LABELS[position.appointmentMethod as keyof typeof METHOD_LABELS],
    },
  });

  return NextResponse.json({
    ok: true,
    application: {
      id: inserted[0]!.id,
      applicationId,
      positionName: position.positionName,
      submittedAt: new Date().toISOString(),
      status: "submitted",
      statusLabel: STATUS_LABELS.submitted,
    },
  });
}
