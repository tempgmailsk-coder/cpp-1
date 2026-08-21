import { NextResponse } from "next/server";
import { db } from "@/db";
import { positions } from "@/db/schema";
import { z } from "zod";
import { jsonError, requireApiAdmin, guardMutatingRequest, clientIp } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { APPOINTMENT_METHODS } from "@/lib/constants";

const POSITION_SCHEMA = z.object({
  positionName: z.string().trim().min(3, "Position name is required"),
  rank: z.coerce.number().int().min(1),
  level: z.enum(["national", "state"]),
  wing: z.string().trim().min(2, "Wing is required"),
  state: z.string().trim().optional().or(z.literal("")),
  description: z.string().trim().min(10, "Description is required"),
  responsibilities: z.array(z.string().min(2)).min(1),
  appointmentMethod: z.enum([
    "election",
    "electoral_college",
    "appointment",
    "joint_appointment",
    "provisional_appointment",
    "committee_selection",
  ]),
  eligibility: z.array(z.string().min(2)).min(1),
  termInfo: z.string().trim().min(3, "Term information is required"),
  vacancies: z.coerce.number().int().min(1),
  vacancyStatus: z.enum(["open", "closed"]),
  applicationDeadline: z.string().optional().or(z.literal("")),
  constitutionalReference: z.string().trim().optional(),
  requireVerification: z.boolean().optional(),
  stateMatch: z.boolean().optional(),
  minAgeYears: z.coerce.number().int().min(18).max(100).optional(),
});

export async function POST(req: Request) {
  const guard = await guardMutatingRequest(req);
  if (guard) return guard;

  const auth = await requireApiAdmin(req, clientIp(req));
  if ("error" in auth) return auth.error;
  const { session } = auth;

  const body = await req.json().catch(() => null);
  const parsed = POSITION_SCHEMA.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }
  const data = parsed.data;

  const inserted = await db
    .insert(positions)
    .values({
      positionName: data.positionName,
      rank: data.rank,
      level: data.level,
      wing: data.wing,
      state: data.state || null,
      description: data.description,
      responsibilities: data.responsibilities,
      appointmentMethod: data.appointmentMethod,
      eligibility: data.eligibility,
      eligibilityRules: {
        minAgeYears: data.minAgeYears ?? 18,
        requireVerification: data.requireVerification !== false,
        stateMatch: data.stateMatch === true,
      },
      termInfo: data.termInfo,
      vacancies: data.vacancies,
      vacancyStatus: data.vacancyStatus,
      applicationDeadline: data.applicationDeadline ? new Date(data.applicationDeadline) : null,
      constitutionalReference: data.constitutionalReference || null,
    })
    .returning({ id: positions.id, positionName: positions.positionName });

  await logAudit({
    adminId: session.sub,
    adminName: session.name,
    action: "position_created",
    targetType: "position",
    targetId: String(inserted[0]!.id),
    details: {
      position: data.positionName,
      method: data.appointmentMethod,
      level: data.level,
    },
  });

  return NextResponse.json({ ok: true, id: inserted[0]!.id });
}

export async function GET() {
  return NextResponse.json({
    appointmentMethods: APPOINTMENT_METHODS,
  });
}
