import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";

export async function POST() {
  const res = NextResponse.json({ ok: true, redirect: "/" });
  res.cookies.set("cpp_session", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return res;
}

export async function GET() {
  return jsonError("Method not allowed.", 405);
}
