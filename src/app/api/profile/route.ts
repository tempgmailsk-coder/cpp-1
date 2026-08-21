import { NextResponse } from "next/server";
import { db } from "@/db";
import { members } from "@/db/schema";
import { eq } from "drizzle-orm";
import { PROFILE_SCHEMA, CHANGE_PASSWORD_SCHEMA, hashPassword, verifyPassword } from "@/lib/auth";
import { jsonError, requireApiUser, guardMutatingRequest, clientIp } from "@/lib/api";
import { notify } from "@/lib/notify";
import { logAudit } from "@/lib/audit";

export async function PATCH(req: Request) {
  const guard = await guardMutatingRequest(req);
  if (guard) return guard;

  const auth = await requireApiUser(req, clientIp(req));
  if ("error" in auth) return auth.error;
  const { session } = auth;

  const body = await req.json().catch(() => null);
  const parsed = PROFILE_SCHEMA.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const data = parsed.data;
  await db
    .update(members)
    .set({
      phone: data.phone,
      state: data.state,
      district: data.district,
      constituency: data.constituency,
      address: data.address,
      education: data.education,
      profession: data.profession,
      skills: data.skills,
      previousExperience: data.previousExperience || null,
      otpEnabled: data.otpEnabled ?? false,
      updatedAt: new Date(),
    })
    .where(eq(members.id, session.sub));

  return NextResponse.json({ ok: true });
}

export async function POST(req: Request) {
  const guard = await guardMutatingRequest(req);
  if (guard) return guard;

  const auth = await requireApiUser(req, clientIp(req));
  if ("error" in auth) return auth.error;
  const { session } = auth;

  const body = await req.json().catch(() => null);
  const parsed = CHANGE_PASSWORD_SCHEMA.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 422 }
    );
  }

  const rows = await db.select().from(members).where(eq(members.id, session.sub)).limit(1);
  const member = rows[0];
  if (!member) return jsonError("Member not found.", 404);

  if (!(await verifyPassword(parsed.data.currentPassword, member.passwordHash))) {
    return jsonError("Your current password is incorrect.", 401);
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await db
    .update(members)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(members.id, member.id));

  await notify({
    memberId: member.id,
    memberEmail: member.email,
    memberName: member.name,
    type: "account",
    subject: "Your CPP account password was changed",
    message: "Your account password has been changed. If this was not you, contact the administration immediately.",
    relatedType: "member",
    relatedId: member.id,
  });

  await logAudit({
    adminName: member.name,
    action: "password_changed",
    targetType: "member",
    targetId: member.memberId,
  });

  return NextResponse.json({ ok: true });
}
