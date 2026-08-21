import { NextResponse } from "next/server";
import { db } from "@/db";
import { positions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { jsonError, requireApiAdmin, guardMutatingRequest, clientIp } from "@/lib/api";
import { logAudit } from "@/lib/audit";

const UPDATE_SCHEMA = z.object({
  positionName: z.string().trim().min(3).optional(),
  rank: z.coerce.number().int().min(1).optional(),
  wing: z.string().trim().min(2).optional(),
  state: z.string().trim().optional().nullable(),
  description: z.string().trim().min(10).optional(),
  responsibilities: z.array(z.string().min(2)).optional(),
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
  eligibility: z.array(z.string().min(2)).optional(),
  termInfo: z.string().trim().optional(),
  vacancies: z.coerce.number().int().min(0).optional(),
  vacancyStatus: z.enum(["open", "closed"]).optional(),
  applicationDeadline: z.string().optional().nullable(),
  constitutionalReference: z.string().trim().optional().nullable(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await guardMutatingRequest(req);
  if (guard) return guard;

  const auth = await requireApiAdmin(req, clientIp(req));
  if ("error" in auth) return auth.error;
  const { session } = auth;

  const { id } = await params;
  const positionId = Number(id);
  if (!Number.isInteger(positionId)) return jsonError("Invalid position.");

  const body = await req.json().catch(() => null);
  const parsed = UPDATE_SCHEMA.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }
  const data = parsed.data;

  const rows = await db
    .select()
    .from(positions)
    .where(eq(positions.id, positionId))
    .limit(1);
  const existing = rows[0];
  if (!existing) return jsonError("Position not found.", 404);

  const patch: Record<string, unknown> = {};
  if (data.positionName !== undefined) patch.positionName = data.positionName;
  if (data.rank !== undefined) patch.rank = data.rank;
  if (data.wing !== undefined) patch.wing = data.wing;
  if (data.state !== undefined) patch.state = data.state || null;
  if (data.description !== undefined) patch.description = data.description;
  if (data.responsibilities !== undefined) patch.responsibilities = data.responsibilities;
  if (data.appointmentMethod !== undefined) patch.appointmentMethod = data.appointmentMethod;
  if (data.eligibility !== undefined) patch.eligibility = data.eligibility;
  if (data.termInfo !== undefined) patch.termInfo = data.termInfo;
  if (data.vacancies !== undefined) patch.vacancies = data.vacancies;
  if (data.vacancyStatus !== undefined) patch.vacancyStatus = data.vacancyStatus;
  if (data.applicationDeadline !== undefined) {
    patch.applicationDeadline = data.applicationDeadline
      ? new Date(data.applicationDeadline)
      : null;
  }
  if (data.constitutionalReference !== undefined) {
    patch.constitutionalReference = data.constitutionalReference || null;
  }

  if (Object.keys(patch).length > 0) {
    patch.updatedAt = new Date();
    await db.update(positions).set(patch).where(eq(positions.id, positionId));
  }

  const changed = Object.keys(patch).filter((k) => k !== "updatedAt");
  await logAudit({
    adminId: session.sub,
    adminName: session.name,
    action: "position_updated",
    targetType: "position",
    targetId: String(positionId),
    details: { position: existing.positionName, changedFields: changed, by: session.name },
  });

  return NextResponse.json({ ok: true });
}
