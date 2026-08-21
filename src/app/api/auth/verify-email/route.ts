import { NextResponse } from "next/server";
import { db } from "@/db";
import { members } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { hashToken, randomToken } from "@/lib/auth";
import { createSessionToken } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";
import { jsonError, clientIp, guardMutatingRequest, requestOrigin } from "@/lib/api";
import { verificationEmail, isDemoEmailMode } from "@/lib/email";
import { notify } from "@/lib/notify";
import { logAudit } from "@/lib/audit";
import { roleHome } from "@/lib/constants";
import type { Role } from "@/db/schema";

export async function POST(req: Request) {
  const guard = await guardMutatingRequest(req);
  if (guard) return guard;

  const ip = clientIp(req);
  const rl = rateLimit(`verify-email:${ip}`, 20, 60_000);
  if (!rl.ok) return jsonError("Too many attempts. Try again shortly.", 429);

  const body = await req.json().catch(() => null);
  const token: string | undefined = body?.token;
  const email: string | undefined = body?.email;

  if (email) {
    // "resend" flow: issue a fresh token for the given email.
    const rows = await db
      .select()
      .from(members)
      .where(eq(members.email, String(email).toLowerCase()))
      .limit(1);
    const member = rows[0];
    if (member && !member.emailVerified) {
      const fresh = randomToken(32);
      await db
        .update(members)
        .set({ emailVerificationToken: hashToken(fresh) })
        .where(eq(members.id, member.id));
      const origin = requestOrigin(req);
      const verifyUrl = `${origin}/verify-email?token=${fresh}`;
      await notify({
        memberId: member.id,
        memberEmail: member.email,
        memberName: member.name,
        type: "email_verified",
        subject: "Verify your CPP email address",
        message: "Please verify your email address to activate your CPP member profile.",
        html: verificationEmail(member.name, member.memberId, verifyUrl),
        relatedType: "member",
        relatedId: member.id,
      });
      return NextResponse.json({
        ok: true,
        demoVerifyLink: isDemoEmailMode() ? verifyUrl : null,
      });
    }
    return NextResponse.json({ ok: true, demoVerifyLink: null });
  }

  if (!token || typeof token !== "string") {
    return jsonError("Verification token is missing.");
  }

  const rows = await db
    .select()
    .from(members)
    .where(eq(members.emailVerificationToken, hashToken(token)))
    .limit(1);

  const member = rows[0];
  if (!member) {
    return jsonError("This verification link is invalid or has already been used.", 400);
  }

  if (!member.emailVerified) {
    await db
      .update(members)
      .set({ emailVerified: true, emailVerificationToken: null })
      .where(eq(members.id, member.id));

    await notify({
      memberId: member.id,
      memberEmail: member.email,
      memberName: member.name,
      type: "email_verified",
      subject: "Your CPP email address is verified",
      message: "Your email address has been verified. Welcome to the CPP membership portal.",
      relatedType: "member",
      relatedId: member.id,
    });

    await logAudit({
      adminName: member.name,
      action: "email_verified",
      targetType: "member",
      targetId: member.memberId,
    });
  }

  if (member.membershipStatus === "suspended") {
    return NextResponse.json({ ok: true, redirect: "/login", suspended: true });
  }

  // Auto sign-in after verification.
  const sessionToken = createSessionToken({
    sub: member.id,
    mid: member.memberId,
    name: member.name,
    role: (member.role as Role) ?? "member",
  });
  const res = NextResponse.json({ ok: true, redirect: roleHome(member.role) });
  res.cookies.set("cpp_session", sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}

export async function GET() {
  return jsonError("Method not allowed.", 405);
}
