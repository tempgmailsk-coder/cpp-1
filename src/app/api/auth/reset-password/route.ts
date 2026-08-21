import { NextResponse } from "next/server";
import { db } from "@/db";
import { members } from "@/db/schema";
import { eq } from "drizzle-orm";
import { RESET_SCHEMA, hashPassword, hashToken } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { jsonError, clientIp, guardMutatingRequest } from "@/lib/api";
import { notify } from "@/lib/notify";
import { logAudit } from "@/lib/audit";

export async function POST(req: Request) {
  const guard = await guardMutatingRequest(req);
  if (guard) return guard;

  const ip = clientIp(req);
  const rl = rateLimit(`reset-password:${ip}`, 10, 60_000);
  if (!rl.ok) return jsonError("Too many attempts. Try again shortly.", 429);

  const body = await req.json().catch(() => null);
  const token: string | undefined = body?.token;
  const parsed = RESET_SCHEMA.safeParse(body);

  if (!token || typeof token !== "string") {
    return jsonError("Reset link is invalid or expired.");
  }
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid password.");
  }

  const rows = await db
    .select()
    .from(members)
    .where(eq(members.resetToken, hashToken(token)))
    .limit(1);

  const member = rows[0];
  if (
    !member ||
    !member.resetTokenExpiresAt ||
    new Date(member.resetTokenExpiresAt).getTime() < Date.now()
  ) {
    return jsonError("Reset link is invalid or has expired. Request a new one.", 400);
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await db
    .update(members)
    .set({ passwordHash, resetToken: null, resetTokenExpiresAt: null })
    .where(eq(members.id, member.id));

  await notify({
    memberId: member.id,
    memberEmail: member.email,
    memberName: member.name,
    type: "password_reset",
    subject: "Your CPP password has been changed",
    message: "Your account password was successfully reset.",
    relatedType: "member",
    relatedId: member.id,
  });

  await logAudit({
    adminName: member.name,
    action: "password_reset",
    targetType: "member",
    targetId: member.memberId,
  });

  return NextResponse.json({ ok: true });
}
