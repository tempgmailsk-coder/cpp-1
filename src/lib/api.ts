import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { isAdminRole } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";

export function jsonError(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export function jsonOk<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

/** Basic CSRF defence: reject cross-origin mutating requests. */
export function isCrossOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return false; // same-origin fetch may omit it; browsers always send it cross-site
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!host) return true;
  try {
    const originHost = new URL(origin).host;
    return originHost !== host;
  } catch {
    return true;
  }
}

export async function guardMutatingRequest(req: Request): Promise<NextResponse | null> {
  if (isCrossOrigin(req)) {
    return jsonError("Cross-origin request rejected.", 403);
  }
  return null;
}

/** Require a valid session for an API route. */
export async function requireApiUser(req: Request, ip?: string) {
  if (ip) {
    const rl = rateLimit(`api:${ip}:${new URL(req.url).pathname}`, 60, 60_000);
    if (!rl.ok) {
      return { error: NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429 }) };
    }
  }
  const session = await getSession();
  if (!session) {
    return { error: jsonError("You must be signed in.", 401) };
  }
  return { session };
}

/** Require an administrative session for an API route. */
export async function requireApiAdmin(req: Request, ip?: string) {
  const result = await requireApiUser(req, ip);
  if ("error" in result) return result;
  if (!isAdminRole(result.session.role)) {
    return { error: jsonError("Administrator access required.", 403) };
  }
  return { session: result.session };
}

export function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "local"
  );
}

/** Origin of the request as seen by the visitor (respects reverse proxies). */
export function requestOrigin(req: Request): string {
  const proto =
    req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
    "http";
  const host =
    req.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    req.headers.get("host") ||
    "localhost:3000";
  return `${proto}://${host}`;
}
