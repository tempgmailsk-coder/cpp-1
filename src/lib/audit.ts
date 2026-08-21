import { db } from "@/db";
import { auditLogs } from "@/db/schema";

/** Record an administrative action in the audit log. */
export async function logAudit(input: {
  adminId?: number | null;
  adminName?: string | null;
  action: string;
  targetType?: string;
  targetId?: string;
  details?: Record<string, unknown>;
}): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      adminId: input.adminId ?? null,
      adminName: input.adminName ?? null,
      action: input.action,
      targetType: input.targetType ?? null,
      targetId: input.targetId ?? null,
      details: input.details ?? null,
    });
  } catch (err) {
    // Never break the primary flow because audit logging failed.
    console.error("audit log failed", err);
  }
}
