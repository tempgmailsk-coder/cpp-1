import { NextResponse } from "next/server";
import { db } from "@/db";
import { members } from "@/db/schema";
import { eq } from "drizzle-orm";
import { OTP_SCHEMA, hashToken } from "@/lib/auth";
import { createSessionToken } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";
import { jsonError, clientIp, guardMutatingRequest } from "@/lib/api";
import { roleHome } from "@/lib/constants";
import type { Role } from "@/db/schema";

export async function POST(req: Request) {
  const guard = await guardMutatingRequest(req);
  if (guard) return guard;

  const ip = clientIp(req);
  const rl = rateLimit(`otp:${ip}`, 10, 60_000);
  if (!rl.ok) return jsonError("Too many attempts. Try again shortly.", 429);

  const body = await req.json().catch(() => null);
  const parsed = OTP_SCHEMA.safeParse(body);
  if (!parsed.success) return jsonError("Enter the 6-digit verification code.");

  // Find a member with a pending OTP that matches (we scan by expiry window).
  const rows = await db.select().from(members);
  const member = rows.find((m) => {
    if (!m.otpHash || !m.otpExpiresAt) return false;
    if (new Date(m.otpExpiresAt).getTime() < Date.now()) return false;
    return m.otpHash === hashToken(parsed.data.otp);
  });

  if (!member) {
    return jsonError("Invalid or expired code. Please sign in again.", 401);
  }

  await db
    .update(members)
    .set({ otpHash: null, otpExpiresAt: null })
    .where(eq(members.id, member.id));

  if (member.membershipStatus === "suspended") {
    return jsonError("Your membership is currently suspended.", 403);
  }

  const token = createSessionToken({
    sub: member.id,
    mid: member.memberId,
    name: member.name,
    role: (member.role as Role) ?? "member",
  });

  const res = NextResponse.json({ ok: true, redirect: roleHome(member.role) });
  res.cookies.set("cpp_session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
