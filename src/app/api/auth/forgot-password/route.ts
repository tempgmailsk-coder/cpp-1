import { NextResponse } from "next/server";
import { db } from "@/db";
import { members } from "@/db/schema";
import { eq } from "drizzle-orm";
import { FORGOT_SCHEMA, randomToken, hashToken } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { jsonError, clientIp, guardMutatingRequest, requestOrigin } from "@/lib/api";
import { resetPasswordEmail, isDemoEmailMode } from "@/lib/email";
import { notify } from "@/lib/notify";

export async function POST(req: Request) {
  const guard = await guardMutatingRequest(req);
  if (guard) return guard;

  const ip = clientIp(req);
  const rl = rateLimit(`forgot-password:${ip}`, 5, 60_000);
  if (!rl.ok) return jsonError("Too many requests. Try again in a minute.", 429);

  const body = await req.json().catch(() => null);
  const parsed = FORGOT_SCHEMA.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid email.");

  const rows = await db
    .select()
    .from(members)
    .where(eq(members.email, parsed.data.email))
    .limit(1);

  const member = rows[0];
  if (member) {
    const token = randomToken(32);
    await db
      .update(members)
      .set({
        resetToken: hashToken(token),
        resetTokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
      })
      .where(eq(members.id, member.id));

    const origin = requestOrigin(req);
    const resetUrl = `${origin}/reset-password?token=${token}`;

    await notify({
      memberId: member.id,
      memberEmail: member.email,
      memberName: member.name,
      type: "password_reset",
      subject: "CPP password reset request",
      message: "We received a request to reset your password. Use the link in this email.",
      html: resetPasswordEmail(member.name, resetUrl),
      relatedType: "member",
      relatedId: member.id,
    });

    return NextResponse.json({
      ok: true,
      demoResetLink: isDemoEmailMode() ? resetUrl : null,
    });
  }

  // Same response whether or not the account exists (no user enumeration).
  return NextResponse.json({ ok: true, demoResetLink: null });
}
