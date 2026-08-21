import { NextResponse } from "next/server";
import { db } from "@/db";
import { members } from "@/db/schema";
import { eq } from "drizzle-orm";
import { jsonError, requireApiAdmin, guardMutatingRequest, clientIp } from "@/lib/api";
import { notify } from "@/lib/notify";
import { logAudit } from "@/lib/audit";
import type { Role } from "@/db/schema";

const ADMIN_ROLE_SET = new Set<Role>([
  "super_admin",
  "national_admin",
  "appointment_authority",
  "state_admin",
]);

const MEMBER_ROLE_SET = new Set<Role>([
  "member",
  "state_admin",
  "national_admin",
  "appointment_authority",
  "super_admin",
]);

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
  const memberIdNum = Number(id);
  if (!Number.isInteger(memberIdNum)) return jsonError("Invalid member.");

  const body = await req.json().catch(() => null);
  const action: string | undefined = body?.action;

  const rows = await db
    .select()
    .from(members)
    .where(eq(members.id, memberIdNum))
    .limit(1);
  const member = rows[0];
  if (!member) return jsonError("Member not found.", 404);

  const auditBase = {
    adminId: session.sub,
    adminName: session.name,
    targetType: "member",
    targetId: member.memberId,
  };

  switch (action) {
    case "verify": {
      await db
        .update(members)
        .set({ verificationStatus: "verified", updatedAt: new Date() })
        .where(eq(members.id, member.id));
      await notify({
        memberId: member.id,
        memberEmail: member.email,
        memberName: member.name,
        type: "account",
        subject: "Your CPP identity verification is complete",
        message: "Your identity documents have been verified by the CPP administration.",
        relatedType: "member",
        relatedId: member.id,
      });
      await logAudit({
        ...auditBase,
        action: "member_verified",
        details: { by: session.name },
      });
      return NextResponse.json({ ok: true, verificationStatus: "verified" });
    }

    case "reject_verification": {
      await db
        .update(members)
        .set({ verificationStatus: "rejected", updatedAt: new Date() })
        .where(eq(members.id, member.id));
      await notify({
        memberId: member.id,
        memberEmail: member.email,
        memberName: member.name,
        type: "account",
        subject: "CPP identity verification requires attention",
        message: "Your identity verification was rejected. Please contact the CPP administration.",
        relatedType: "member",
        relatedId: member.id,
      });
      await logAudit({
        ...auditBase,
        action: "member_verification_rejected",
        details: { by: session.name },
      });
      return NextResponse.json({ ok: true, verificationStatus: "rejected" });
    }

    case "suspend": {
      const reason = String(body?.reason ?? "").slice(0, 300);
      await db
        .update(members)
        .set({ membershipStatus: "suspended", suspendedReason: reason || null, updatedAt: new Date() })
        .where(eq(members.id, member.id));
      await notify({
        memberId: member.id,
        memberEmail: member.email,
        memberName: member.name,
        type: "account",
        subject: "Your CPP membership has been suspended",
        message: `Your membership has been suspended.${reason ? ` Reason: ${reason}` : ""}`,
        relatedType: "member",
        relatedId: member.id,
      });
      await logAudit({
        ...auditBase,
        action: "member_suspended",
        details: { by: session.name, reason },
      });
      return NextResponse.json({ ok: true, membershipStatus: "suspended" });
    }

    case "activate": {
      await db
        .update(members)
        .set({ membershipStatus: "active", suspendedReason: null, updatedAt: new Date() })
        .where(eq(members.id, member.id));
      await notify({
        memberId: member.id,
        memberEmail: member.email,
        memberName: member.name,
        type: "account",
        subject: "Your CPP membership has been reactivated",
        message: "Your membership has been reactivated by the administration.",
        relatedType: "member",
        relatedId: member.id,
      });
      await logAudit({
        ...auditBase,
        action: "member_activated",
        details: { by: session.name },
      });
      return NextResponse.json({ ok: true, membershipStatus: "active" });
    }

    case "set_role": {
      if (session.role !== "super_admin" && session.role !== "national_admin") {
        return jsonError("Only the Super Administrator or a National Administrator may change roles.", 403);
      }
      const role = body?.role as string;
      if (!MEMBER_ROLE_SET.has(role as Role)) return jsonError("Invalid role.");
      if (member.role === "super_admin" && session.role !== "super_admin") {
        return jsonError("You cannot modify the role of another Super Administrator.", 403);
      }
      await db
        .update(members)
        .set({ role, updatedAt: new Date() })
        .where(eq(members.id, member.id));
      await logAudit({
        ...auditBase,
        action: "member_role_changed",
        details: { by: session.name, from: member.role, to: role },
      });
      return NextResponse.json({ ok: true, role });
    }

    default:
      return jsonError(
        "Unknown action. Allowed: verify, reject_verification, suspend, activate, set_role."
      );
  }
}
