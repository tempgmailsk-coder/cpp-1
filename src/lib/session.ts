import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { cache } from "react";
import { redirect } from "next/navigation";
import { ADMIN_ROLES, type Role } from "@/db/schema";

const COOKIE_NAME = "cpp_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

const SECRET =
  process.env.SESSION_SECRET ??
  "cpp-dev-secret-change-me-in-production-2026";

export interface SessionPayload {
  sub: number; // member id
  mid: string; // member id string
  name: string;
  role: Role;
  exp: number;
}

function sign(data: string): string {
  return createHmac("sha256", SECRET).update(data).digest("base64url");
}

export function createSessionToken(payload: Omit<SessionPayload, "exp">): string {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const body = Buffer.from(
    JSON.stringify({ ...payload, exp })
  ).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = sign(body);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const parsed = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8")
    ) as SessionPayload;
    if (!parsed.sub || !parsed.exp || parsed.exp < Date.now() / 1000) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/** Read and verify the session from cookies. */
export const getSession = cache(async (): Promise<SessionPayload | null> => {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
});

/** Verify the session is still valid in the database (role/suspension aware). */
export async function getCurrentMember() {
  const session = await getSession();
  if (!session) return null;
  const { db } = await import("@/db");
  const { members } = await import("@/db/schema");
  const { eq } = await import("drizzle-orm");
  const rows = await db
    .select()
    .from(members)
    .where(eq(members.id, session.sub))
    .limit(1);
  const member = rows[0];
  if (!member || member.membershipStatus === "suspended") return null;
  return member;
}

export async function requireMember() {
  const member = await getCurrentMember();
  if (!member) redirect("/login?next=/dashboard");
  return member;
}

export async function requireAdmin() {
  const member = await getCurrentMember();
  if (!member) redirect("/login?next=/admin");
  if (!ADMIN_ROLES.includes(member.role as Role)) redirect("/dashboard");
  return member;
}

export function isAdminRole(role: string): boolean {
  return ADMIN_ROLES.includes(role as Role);
}
