import { NextResponse } from "next/server";
import { db } from "@/db";
import { members } from "@/db/schema";
import { or, eq, sql } from "drizzle-orm";
import { LOGIN_SCHEMA, verifyPassword, generateOtp, hashToken } from "@/lib/auth";
import { createSessionToken } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";
import { jsonError, clientIp, guardMutatingRequest, requestOrigin } from "@/lib/api";
import { otpEmail, isDemoEmailMode, sendEmail } from "@/lib/email";
import { maskEmail, roleHome } from "@/lib/constants";
import { logAudit } from "@/lib/audit";
import type { Role } from "@/db/schema";

const SESSION_COOKIE = "cpp_session";
const OTP_TTL_MS = 10 * 60 * 1000;

export async function POST(req: Request) {
  const guard = await guardMutatingRequest(req);
  if (guard) return guard;

  const ip = clientIp(req);
  const rl = rateLimit(`login:${ip}`, 10, 60_000);
  if (!rl.ok) {
    return jsonError("Too many sign-in attempts. Please try again shortly.", 429);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid request.");
  }

  const parsed = LOGIN_SCHEMA.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid credentials.");
  }

  const { identifier, password } = parsed.data;
  const lookup = identifier.trim().toLowerCase();

  const rows = await db
    .select()
    .from(members)
    .where(
      or(eq(members.email, lookup), eq(sql`lower(${members.memberId})`, lookup))
    )
    .limit(1);

  const member = rows[0];
  if (!member || !(await verifyPassword(password, member.passwordHash))) {
    return jsonError("Invalid email / member ID or password.", 401);
  }

  if (member.membershipStatus === "suspended") {
    return jsonError(
      "Your membership is currently suspended. Contact the CPP administration.",
      403
    );
  }

  if (!member.emailVerified) {
    const origin = requestOrigin(req);
    const demoLink = isDemoEmailMode()
      ? `${origin}/verify-email?token=resend&email=${encodeURIComponent(member.email)}`
      : null;
    return NextResponse.json(
      {
        error: "Your email address has not been verified yet.",
        needsEmailVerification: true,
        demoVerifyLink: demoLink,
      },
      { status: 403 }
    );
  }

  // Optional OTP verification
  if (member.otpEnabled) {
    const otp = generateOtp();
    await db
      .update(members)
      .set({ otpHash: hashToken(otp), otpExpiresAt: new Date(Date.now() + OTP_TTL_MS) })
      .where(eq(members.id, member.id));

    await sendEmail({
      to: member.email,
      subject: "Your CPP login verification code",
      html: otpEmail(member.name, otp),
      relatedType: "member",
      relatedId: member.id,
    });

    return NextResponse.json({
      needsOtp: true,
      demoOtp: isDemoEmailMode() ? otp : null,
      hint: `We sent a 6-digit code to ${maskEmail(member.email)}.`,
    });
  }

  const token = createSessionToken({
    sub: member.id,
    mid: member.memberId,
    name: member.name,
    role: (member.role as Role) ?? "member",
  });

  await logAudit({
    adminName: member.name,
    action: "member_login",
    targetType: "member",
    targetId: member.memberId,
  });

  const res = NextResponse.json({ ok: true, redirect: roleHome(member.role) });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}


